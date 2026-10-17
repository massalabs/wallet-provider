import { UserRejectionError } from '../errors';
import { isUserRejectionError } from '../errors/utils/errorHandler';
import { RustCoreInjected, RustCoreNetwork } from './types';
import { isRustCoreNetwork } from './utils';

/**
 * The connection to window.rustcore that a RustCoreWallet shares with its
 * accounts.
 *
 * @remarks
 * - The extension answers a second `connect` from the same site with 4900
 *   (Busy) while the first waits for the user, so a pending connect is reused.
 * - The wallet's network is kept until the extension says it changed, so reads
 *   don't ask the extension for it each time.
 */
export class RustCoreSession {
  private pendingConnect?: Promise<string | null>;
  private network?: Promise<RustCoreNetwork>;

  public constructor(public readonly rustcore: RustCoreInjected) {
    rustcore.on('networkChanged', (data) => {
      this.network = isRustCoreNetwork(data)
        ? Promise.resolve(data)
        : undefined;
    });
    // a disconnected site can't read the network: ask again once reconnected
    rustcore.on('disconnect', () => {
      this.network = undefined;
    });
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

  /** The wallet's current network, asking to connect the site first if needed. */
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
    if (!(await this.connected()) && (await this.connect()) === null) {
      throw new UserRejectionError({ operationName: 'connect' });
    }
    const network = await this.rustcore.request('network');
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
