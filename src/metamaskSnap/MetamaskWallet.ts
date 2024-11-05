import { web3 } from '@hicaru/bearby.js';
import { Wallet } from '../wallet/interface';
import {
  getNetworkNameByChainId,
  Network,
  Provider,
} from '@massalabs/massa-web3';
import { WalletName } from '../wallet';
import { getMetamaskProvider } from './metamask';
import { connectSnap, getMassaSnapInfo } from './snap';
import { MetamaskAccount } from './MetamaskAccount';
import { MetaMaskInpageProvider } from '@metamask/providers';
import { getActiveAccount, getNetwork } from './services';

export class MetamaskWallet implements Wallet {
  private walletName = WalletName.Metamask;
  private metamaskProvider: MetaMaskInpageProvider;

  public name(): WalletName {
    return this.walletName;
  }

  public constructor(provider: MetaMaskInpageProvider) {
    this.metamaskProvider = provider;
  }

  static async createIfInstalled(): Promise<Wallet | null> {
    try {
      const metamask = await getMetamaskProvider();
      if (!metamask) return null;

      const snap = await getMassaSnapInfo(metamask);
      if (!snap) {
        await connectSnap(metamask);
      }

      return new MetamaskWallet(metamask);
    } catch (error) {
      return null;
    }
  }

  public async accounts(): Promise<MetamaskAccount[]> {
    const res = await getActiveAccount(this.metamaskProvider);
    return [new MetamaskAccount(res.address, this.metamaskProvider)];
  }

  public async importAccount(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    publicKey: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    privateKey: string,
  ): Promise<void> {
    throw new Error('Method not implemented.');
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public async deleteAccount(address: string): Promise<void> {
    throw new Error('Method not implemented.');
  }

  public async networkInfos(): Promise<Network> {
    const res = await getNetwork(this.metamaskProvider);

    return {
      name: getNetworkNameByChainId(BigInt(res.chainId)),
      chainId: BigInt(res.chainId),
      url: res.network,
      minimalFee: BigInt(res.minimalFees),
    };
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
    // TODO
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
  public listenNetworkChanges(callback: (network: string) => void): {
    unsubscribe: () => void;
  } {
    return web3.wallet.network.subscribe((network) => callback(network));
  }

  /**
   * Connects to the wallet.
   *
   * @remarks
   * This method will attempt to establish a connection with the wallet.
   * If the connection fails, it will log the error message.
   */
  public async connect() {
    try {
      // TODO: This ask to install the snap every time even if it is already installed
      await connectSnap(this.metamaskProvider);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Disconnects from the wallet.
   *
   * @remarks
   * This method will attempt to disconnect from the wallet.
   * If the disconnection fails, it will log the error message.
   */
  public async disconnect() {
    // TODO
    return web3.wallet.disconnect();
  }

  /**
   * Checks if the wallet is connected.
   *
   * @returns a boolean indicating whether the wallet is connected.
   */
  public connected(): boolean {
    // TODO: Put provider on the global scope
    // const provider = await getMetaMaskEIP6963Provider();

    // return provider.isConnected();
    return true;
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
