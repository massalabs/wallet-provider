import { Network, Provider } from '@massalabs/massa-web3';
import { Wallet } from '../wallet/interface';
import { ListenerCtrl, WalletName } from '../wallet';
import { RustCoreAccount } from './RustCoreAccount';
import { RustCoreSession } from './session';
import { RustCoreInjected } from './types';
import {
  getRustCore,
  isAddressList,
  isRustCoreNetwork,
  toNetwork,
} from './utils';

/**
 * RustCore Wallet, a browser extension (Chromium and Firefox) that injects
 * `window.rustcore` into web pages.
 *
 * @remarks
 * A site connects once and gets the accounts the user ticks (one before
 * version 1.6.0); it uses the one the user last switched to. Every
 * signature (transfers, rolls, contract calls, messages) is approved by the
 * user in the extension. Websites can't import, delete or create accounts,
 * nor change the wallet's node.
 */
export class RustCoreWallet implements Wallet {
  private walletName = WalletName.RustCore;

  private readonly session: RustCoreSession;

  public constructor(private readonly rustcore: RustCoreInjected) {
    this.session = RustCoreSession.for(rustcore);
  }

  public name(): WalletName {
    return this.walletName;
  }

  static async createIfInstalled(): Promise<Wallet | null> {
    const rustcore = getRustCore();
    return rustcore ? new RustCoreWallet(rustcore) : null;
  }

  /**
   * The accounts the user shared with this site, the one in use first. Asks
   * the user to connect the site first if it isn't connected yet.
   */
  public async accounts(): Promise<RustCoreAccount[]> {
    const addresses = await this.session.addresses();
    return addresses.map(
      (address) => new RustCoreAccount(address, this.session),
    );
  }

  public async importAccount(): Promise<void> {
    throw new Error('RustCore Wallet does not import accounts from websites.');
  }

  public async deleteAccount(): Promise<void> {
    throw new Error('RustCore Wallet does not delete accounts from websites.');
  }

  public async networkInfos(): Promise<Network> {
    return toNetwork(await this.session.connectedNetwork());
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
   * Subscribes to the account this site uses changing: the user switched to
   * another of the accounts shared with it, or picked another one in the
   * wallet's settings.
   *
   * @remarks
   * From version 1.6.0, an account object keeps signing as its own address
   * after a switch: to sign as the new account, use the one from `accounts()`.
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
   * Subscribes to the accounts shared with this site changing (from version
   * 1.6.0): the callback gets them all, the one in use first. The wallet
   * refuses signatures from an account taken away from the site.
   *
   * @example
   * ```typescript
   * const observer = wallet.listenAccountsChanges((addresses) => {
   *   console.log(addresses);
   * });
   * observer.unsubscribe();
   * ```
   */
  public listenAccountsChanges(
    callback: (addresses: string[]) => void,
  ): ListenerCtrl {
    const unsubscribe = this.rustcore.on('accountsChanged', (data) => {
      const addresses = (data as { addresses?: unknown })?.addresses;
      if (isAddressList(addresses)) callback(addresses);
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
    const unsubscribe = this.rustcore.on('networkChanged', (data) => {
      if (isRustCoreNetwork(data)) callback(toNetwork(data));
    });
    return { unsubscribe };
  }

  /**
   * Subscribes to the user disconnecting this site in the wallet. Reads,
   * transfers, rolls and contract calls then ask the user to connect it again.
   *
   * @example
   * ```typescript
   * const observer = wallet.listenDisconnect(() => {
   *   console.log('disconnected');
   * });
   * observer.unsubscribe();
   * ```
   */
  public listenDisconnect(callback: () => void): ListenerCtrl {
    const unsubscribe = this.rustcore.on('disconnect', () => callback());
    return { unsubscribe };
  }

  /**
   * Asks the user to connect this site (once per site).
   *
   * @returns true once connected, false if the user declined.
   */
  public async connect(): Promise<boolean> {
    return (await this.session.connect()) !== null;
  }

  public async disconnect(): Promise<boolean> {
    await this.session.disconnect();
    return true;
  }

  public async connected(): Promise<boolean> {
    return this.session.connected();
  }

  public enabled(): boolean {
    return true;
  }
}
