import { UserRejectionError } from '../errors';
import { isUserRejectionError } from '../errors/utils/errorHandler';
import { RustCoreErrorCode, RustCoreInjected, RustCoreNetwork } from './types';
import { isRustCoreNetwork } from './utils';

// one session per injected object, so its listeners are added only once
const sessions = new WeakMap<RustCoreInjected, RustCoreSession>();

/**
 * The connection to window.rustcore that RustCoreWallets share with their
 * accounts.
 *
 * @remarks
 * - A pending connect is reused: the extension joins a second `connect` from
 *   the same site to the waiting one, but versions before 1.5.0 answer it
 *   with 4900 (Busy).
 * - The wallet's network is kept until the extension says it changed, so reads
 *   don't ask the extension for it each time.
 * - Only what the dApp asks for (accounts, network, operations) prompts the
 *   user to connect: background reads of a disconnected site fail instead, so
 *   polling doesn't open a prompt again and again.
 * - From version 1.6.0, the user can share several accounts with a site:
 *   `accounts` lists them and every signature names its account (`from`).
 *   Asking for `accounts` also tells the wallet this site names its signer,
 *   so the site follows the account the user switches to (the wallet keeps
 *   sites that don't on the account they were given). Older versions share
 *   one account, and answer `accounts` with 4200 (Unsupported method); they
 *   get no `from` (1.5.x refuses unknown params).
 */
export class RustCoreSession {
  private pendingConnect?: Promise<string[] | null>;
  private network?: Promise<RustCoreNetwork>;
  /** Does the extension take `accounts` and `from`? Unknown until it says. */
  private severalAccounts?: Promise<boolean>;

  private constructor(public readonly rustcore: RustCoreInjected) {
    rustcore.on('networkChanged', (data) => {
      this.network = isRustCoreNetwork(data)
        ? Promise.resolve(data)
        : undefined;
    });
    rustcore.on('disconnect', () => {
      this.network = undefined;
    });
  }

  /** The session of this injected object. */
  public static for(rustcore: RustCoreInjected): RustCoreSession {
    let session = sessions.get(rustcore);
    if (!session) {
      session = new RustCoreSession(rustcore);
      sessions.set(rustcore, session);
    }
    return session;
  }

  public async disconnect(): Promise<void> {
    await this.rustcore.request('disconnect');
    this.network = undefined;
  }

  public async connected(): Promise<boolean> {
    return (await this.rustcore.request('connected')) === true;
  }

  /**
   * Asks the user to connect this site.
   *
   * @returns the addresses the user shared, the one in use first, or null if
   * they declined.
   */
  public connect(): Promise<string[] | null> {
    this.pendingConnect ??= this.requestConnect().finally(() => {
      this.pendingConnect = undefined;
    });
    return this.pendingConnect;
  }

  /**
   * The shared addresses, the one in use first, asking the user to connect the
   * site first if needed.
   */
  public async addresses(): Promise<string[]> {
    if (await this.connected()) {
      try {
        const addresses = addressesOf(await this.rustcore.request('accounts'));
        this.severalAccounts = Promise.resolve(true);
        return addresses;
      } catch (error) {
        if (!isUnsupported(error)) throw error;
        this.severalAccounts = Promise.resolve(false);
      }
      return [addressOf(await this.rustcore.request('account'))];
    }
    const addresses = await this.connect();
    if (addresses === null) {
      throw new UserRejectionError({ operationName: 'connect' });
    }
    return addresses;
  }

  /**
   * The `from` param that makes `address` sign, for extensions that take it;
   * older ones sign with the site's one account and get nothing.
   */
  public async signedBy(address: string): Promise<{ from?: string }> {
    return (await this.takesFrom()) ? { from: address } : {};
  }

  // Asked once: the extension's version doesn't change while the page lives.
  // A site that isn't connected can't tell (4100): asked again next time.
  private takesFrom(): Promise<boolean> {
    if (!this.severalAccounts) {
      const probe = this.rustcore.request('accounts').then(
        () => true,
        (error) => {
          if (isUnsupported(error)) return false;
          if (this.severalAccounts === probe) this.severalAccounts = undefined;
          return false;
        },
      );
      this.severalAccounts = probe;
    }
    return this.severalAccounts;
  }

  /**
   * The wallet's current network, asking the user to connect the site first
   * if needed.
   */
  public async connectedNetwork(): Promise<RustCoreNetwork> {
    if (
      !this.network &&
      !(await this.connected()) &&
      (await this.connect()) === null
    ) {
      throw new UserRejectionError({ operationName: 'connect' });
    }
    return this.currentNetwork();
  }

  /**
   * The wallet's current network, without prompting the user: fails if the
   * site isn't connected.
   */
  public currentNetwork(): Promise<RustCoreNetwork> {
    if (!this.network) {
      const network = this.fetchNetwork();
      this.network = network;
      network.catch(() => {
        if (this.network === network) this.network = undefined;
      });
    }
    return this.network;
  }

  private async requestConnect(): Promise<string[] | null> {
    let result: unknown;
    try {
      result = await this.rustcore.request('connect');
    } catch (error) {
      if (isUserRejectionError(error as Error)) return null;
      throw error;
    }
    // Versions that share several accounts answer them all.
    const listed = Array.isArray(
      (result as { addresses?: unknown })?.addresses,
    );
    this.severalAccounts = Promise.resolve(listed);
    if (!listed) return [addressOf(result)];
    // Asked at once, so the site follows the user's account switches from the
    // start, not only from its first signature.
    try {
      return addressesOf(await this.rustcore.request('accounts'));
    } catch {
      return addressesOf(result);
    }
  }

  private async fetchNetwork(): Promise<RustCoreNetwork> {
    let network: unknown;
    try {
      network = await this.rustcore.request('network');
    } catch (error) {
      if (
        (error as { code?: unknown })?.code === RustCoreErrorCode.Unauthorized
      ) {
        throw new Error(
          'RustCore Wallet: this site is not connected. Call connect() first.',
          { cause: error },
        );
      }
      throw error;
    }
    if (!isRustCoreNetwork(network)) {
      throw new Error('RustCore Wallet returned an invalid network.');
    }
    return network;
  }
}

function addressesOf(result: unknown): string[] {
  const addresses = (result as { addresses?: unknown })?.addresses;
  if (
    !Array.isArray(addresses) ||
    addresses.length === 0 ||
    !addresses.every((address) => typeof address === 'string')
  ) {
    throw new Error('RustCore Wallet returned invalid accounts.');
  }
  return addresses;
}

/** The extension doesn't know the method (versions before 1.6.0 for `accounts`). */
function isUnsupported(error: unknown): boolean {
  return (
    (error as { code?: unknown })?.code === RustCoreErrorCode.UnsupportedMethod
  );
}

function addressOf(result: unknown): string {
  const address = (result as { address?: unknown })?.address;
  if (typeof address !== 'string') {
    throw new Error('RustCore Wallet returned an invalid account.');
  }
  return address;
}
