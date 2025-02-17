import { Wallet } from '../wallet/interface';
import { Network, Provider } from '@massalabs/massa-web3';
import { WalletName } from '../wallet';
import { getMetamaskProvider } from './metamask';
import { connectSnap, isConnected } from './snap';
import { MetamaskAccount } from './MetamaskAccount';
import { MetaMaskInpageProvider } from '@metamask/providers';
import { getActiveAccount, setRpcUrl } from './services';
import { networkInfos } from './utils/network';
import EventEmitter from 'eventemitter3';

const METAMASK_NETWORK_CHANGED = 'METAMASK_NETWORK_CHANGED';

export class MetamaskWallet implements Wallet {
  private walletName = WalletName.Metamask;
  private metamaskProvider: MetaMaskInpageProvider;
  private eventsListener = new EventEmitter();
  private currentNetwork: Network;

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

      return new MetamaskWallet(metamask);
    } catch (error) {
      return null;
    }
  }

  public async accounts(): Promise<MetamaskAccount[]> {
    const res = await getActiveAccount(this.metamaskProvider);
    return [new MetamaskAccount(res.address, this.metamaskProvider)];
  }

  public async importAccount(): Promise<void> {
    throw new Error('Method not implemented.');
  }

  public async deleteAccount(): Promise<void> {
    throw new Error('Method not implemented.');
  }

  public async networkInfos(): Promise<Network> {
    return await networkInfos(this.metamaskProvider);
  }

  /**
   * Sets the RPC URL for the MetaMask provider.
   *
   * @param url - The new RPC URL.
   * @returns A promise that resolves when the RPC URL is updated.
   */
  public async setRpcUrl(url: string): Promise<void> {
    await setRpcUrl(this.metamaskProvider, { network: url });
  }

  public async generateNewAccount(): Promise<Provider> {
    throw new Error('Method not implemented.');
  }

  public listenAccountChanges(): { unsubscribe: () => void } | undefined {
    throw new Error(
      'listenAccountChanges is not yet implemented for the current provider.',
    );
  }

  /**
   * Subscribes to network changes.
   *
   * @param callback - Callback function called when the network changes.
   * @returns An object with an `unsubscribe` method to stop listening.
   * @remarks Periodically checks for network changes every 500ms.
   *
   * @example
   * ```typescript
   * const observer = await provider.listenNetworkChanges((network) => {
   *   console.log(network);
   * });
   * observer.unsubscribe();
   * ```
   */
  public listenNetworkChanges(
    callback: (network: Network) => void,
  ): { unsubscribe: () => void } | undefined {
    this.eventsListener.on(METAMASK_NETWORK_CHANGED, (evt) => callback(evt));

    const intervalId = setInterval(async () => {
      const network = await this.networkInfos();
      if (!this.currentNetwork) {
        this.currentNetwork = network;
        return;
      }
      if (this.currentNetwork.name !== network.name) {
        this.currentNetwork = network;
        this.eventsListener.emit(METAMASK_NETWORK_CHANGED, network);
      }
    }, 500);

    return {
      unsubscribe: () => {
        clearInterval(intervalId);
        this.eventsListener.removeListener(
          METAMASK_NETWORK_CHANGED,
          // eslint-disable-next-line @typescript-eslint/no-empty-function
          () => {},
        );
      },
    };
  }

  /**
   * Connects to MetaMask and ensures it is unlocked and ready.
   *
   * @returns A promise that resolves to `true` if connected successfully, otherwise `false`.
   */
  public async connect() {
    try {
      const connected = await isConnected(this.metamaskProvider);

      if (!connected) {
        await connectSnap(this.metamaskProvider);
      }
      return true;
    } catch (error) {
      return false;
    }
  }

  public async disconnect(): Promise<boolean> {
    throw new Error('Method not implemented.');
  }

  public connected(): Promise<boolean> {
    return isConnected(this.metamaskProvider);
  }

  public enabled(): boolean {
    throw new Error('Method not implemented.');
  }
}
