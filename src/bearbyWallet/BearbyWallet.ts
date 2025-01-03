import { web3 } from '@hicaru/bearby.js';
import { BearbyAccount } from './BearbyAccount';
import { Wallet } from '../wallet/interface';
import { Network, Provider } from '@massalabs/massa-web3';
import { networkInfos } from './utils/network';
import { WalletName } from '../wallet';

export class BearbyWallet implements Wallet {
  private walletName = WalletName.Bearby;

  public name(): WalletName {
    return this.walletName;
  }

  static async createIfInstalled(): Promise<Wallet | null> {
    if (web3.wallet.installed) {
      return new BearbyWallet();
    }
    return null;
  }

  public async accounts(): Promise<BearbyAccount[]> {
    // check if bearby is unlocked
    if (!web3.wallet.connected) {
      await web3.wallet.connect();
    }
    return [new BearbyAccount(await web3.wallet.account.base58)];
  }

  public async importAccount(): Promise<void> {
    throw new Error('Method not implemented.');
  }

  public async deleteAccount(): Promise<void> {
    throw new Error('Method not implemented.');
  }

  public async networkInfos(): Promise<Network> {
    if (!web3.wallet.connected) {
      await web3.wallet.connect();
    }
    return networkInfos();
  }

  public async setRpcUrl(): Promise<void> {
    throw new Error(
      'setRpcUrl is not yet implemented for the current provider.',
    );
  }

  public async generateNewAccount(): Promise<Provider> {
    throw new Error('Method not implemented.');
  }

  /**
   * Subscribes to account changes.
   *
   * @param callback - Callback to be called when the account changes.
   *
   * @returns A promise that resolves to a function that can be called to unsubscribe.
   *
   * @remarks
   * Don't forget to unsubscribe to avoid memory leaks.
   *
   * @example
   * ```typescript
   * // Subscribe
   * const observer = await provider.listenAccountChanges((base58) => {
   *  console.log(base58);
   * });
   *
   * // Unsubscribe
   * observer.unsubscribe();
   * ```
   */
  public listenAccountChanges(callback: (address: string) => void): {
    unsubscribe: () => void;
  } {
    return web3.wallet.account.subscribe((address) => callback(address));
  }

  /**
   * Subscribes to network changes.
   *
   * @param callback - Callback to be called when the network changes.
   *
   * @returns A promise that resolves to a function that can be called to unsubscribe.
   *
   * @remarks
   * Don't forget to unsubscribe to avoid memory leaks.
   *
   * @example
   * ```typescript
   * // Subscribe
   * const observer = await provider.listenNetworkChanges((network) => {
   *  console.log(network);
   * });
   *
   * // Unsubscribe
   * observer.unsubscribe();
   * ```
   */
  public listenNetworkChanges(callback: (network: Network) => void): {
    unsubscribe: () => void;
  } {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    return web3.wallet.network.subscribe((_) =>
      networkInfos().then((network) => callback(network)),
    );
  }

  /**
   * Connects to the wallet.
   *
   * @remarks
   * This method will attempt to establish a connection with the wallet.
   * If the connection fails, it will log the error message.
   */
  public async connect() {
    return web3.wallet.connect();
  }

  /**
   * Disconnects from the wallet.
   *
   * @remarks
   * This method will attempt to disconnect from the wallet.
   * If the disconnection fails, it will log the error message.
   */
  public async disconnect() {
    return web3.wallet.disconnect();
  }

  /**
   * Checks if the wallet is connected.
   *
   * @returns a boolean indicating whether the wallet is connected.
   */
  public async connected(): Promise<boolean> {
    return web3.wallet.connected;
  }

  /**
   * Checks if the wallet is enabled.
   *
   * @returns a boolean indicating whether the wallet is enabled.
   */
  public enabled(): boolean {
    return web3.wallet.enabled;
  }
}
