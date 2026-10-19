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
 */
export class RustCoreSession {
  private pendingConnect?: Promise<string | null>;
  private network?: Promise<RustCoreNetwork>;

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
   * @returns the address the user shared, or null if they declined.
   */
  public connect(): Promise<string | null> {
    this.pendingConnect ??= this.requestConnect().finally(() => {
      this.pendingConnect = undefined;
    });
    return this.pendingConnect;
  }

  /** The shared address, asking the user to connect the site first if needed. */
  public async address(): Promise<string> {
    if (await this.connected()) {
      return addressOf(await this.rustcore.request('account'));
    }
    const address = await this.connect();
    if (address === null) {
      throw new UserRejectionError({ operationName: 'connect' });
    }
    return address;
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

  private async requestConnect(): Promise<string | null> {
    try {
      return addressOf(await this.rustcore.request('connect'));
    } catch (error) {
      if (isUserRejectionError(error as Error)) return null;
      throw error;
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

function addressOf(result: unknown): string {
  const address = (result as { address?: unknown })?.address;
  if (typeof address !== 'string') {
    throw new Error('RustCore Wallet returned an invalid account.');
  }
  return address;
}
