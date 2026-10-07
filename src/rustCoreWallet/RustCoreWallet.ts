import { Network, Provider } from '@massalabs/massa-web3';
import { Wallet } from '../wallet/interface';
import { UserRejectionError } from '../errors';
import { ListenerCtrl, WalletName } from '../wallet';
import { RustCoreAccount } from './RustCoreAccount';
import { RustCoreInjected, RustCoreNetwork } from './types';
import { getRustCore, isUserRejection, toNetwork } from './utils';

/**
 * RustCore Wallet, a browser extension (Chromium and Firefox) that injects
 * `window.rustcore` into web pages.
 *
 * @remarks
 * A site connects once and gets one account, chosen by the user. Every
 * signature (transfers, rolls, contract calls, messages) is approved by the
 * user in the extension. Websites can't import, delete or create accounts,
 * nor change the wallet's node.
 */
export class RustCoreWallet implements Wallet {
  private walletName = WalletName.RustCore;

  public constructor(private readonly rustcore: RustCoreInjected) {}

  public name(): WalletName {
    return this.walletName;
  }

  static async createIfInstalled(): Promise<Wallet | null> {
    const rustcore = getRustCore();
    return rustcore ? new RustCoreWallet(rustcore) : null;
  }

  /**
   * The account the user shared with this site. Asks the user to connect the
   * site first if it isn't connected yet.
   */
  public async accounts(): Promise<RustCoreAccount[]> {
    await this.ensureConnected();
    const { address } = (await this.rustcore.request('account')) as {
      address: string;
    };
    return [new RustCoreAccount(address, this.rustcore)];
  }

  public async importAccount(): Promise<void> {
    throw new Error('RustCore Wallet does not import accounts from websites.');
  }

  public async deleteAccount(): Promise<void> {
    throw new Error('RustCore Wallet does not delete accounts from websites.');
  }

  public async networkInfos(): Promise<Network> {
    await this.ensureConnected();
    return toNetwork(
      (await this.rustcore.request('network')) as RustCoreNetwork,
    );
  }

  public async setRpcUrl(): Promise<void> {
    throw new Error(
      'setRpcUrl is not supported: RustCore Wallet uses its own nodes.',
    );
  }

  public async generateNewAccount(): Promise<Provider> {
    throw new Error('RustCore Wallet does not create accounts from websites.');
  }

  /**
   * Subscribes to the account shared with this site changing (the user picked
   * another one in the wallet's settings).
   *
   * @example
   * ```typescript
   * const observer = wallet.listenAccountChanges((address) => {
   *   console.log(address);
   * });
   * observer.unsubscribe();
   * ```
   */
  public listenAccountChanges(
    callback: (address: string) => void,
  ): ListenerCtrl {
    const unsubscribe = this.rustcore.on('accountChanged', (data) => {
      const address = (data as { address?: unknown })?.address;
      if (typeof address === 'string') callback(address);
    });
    return { unsubscribe };
  }

  /**
   * Subscribes to the wallet switching network.
   *
   * @example
   * ```typescript
   * const observer = wallet.listenNetworkChanges((network) => {
   *   console.log(network);
   * });
   * observer.unsubscribe();
   * ```
   */
  public listenNetworkChanges(
    callback: (network: Network) => void,
  ): ListenerCtrl {
    const unsubscribe = this.rustcore.on('networkChanged', (data) =>
      callback(toNetwork(data as RustCoreNetwork)),
    );
    return { unsubscribe };
  }

  /**
   * Asks the user to connect this site (once per site).
   *
   * @returns true once connected, false if the user declined.
   */
  public async connect(): Promise<boolean> {
    try {
      await this.rustcore.request('connect');
      return true;
    } catch (error) {
      if (isUserRejection(error)) return false;
      throw error;
    }
  }

  public async disconnect(): Promise<boolean> {
    await this.rustcore.request('disconnect');
    return true;
  }

  public async connected(): Promise<boolean> {
    return (await this.rustcore.request('connected')) === true;
  }

  public enabled(): boolean {
    return true;
  }

  private async ensureConnected(): Promise<void> {
    if (await this.connected()) return;
    if (!(await this.connect())) {
      throw new UserRejectionError({ operationName: 'connect' });
    }
  }
}
