import { Wallet } from '../wallet/interface';
import {
  getNetworkNameByChainId,
  Mas,
  Network,
  Provider,
} from '@massalabs/massa-web3';
import { WalletName } from '../wallet';
import {
  getMetamaskProvider,
  isMetaMaskUnlocked,
  promptAndWaitForWalletUnlock,
} from './metamask';
import { connectSnap, getMassaSnapInfo } from './snap';
import { MetamaskAccount } from './MetamaskAccount';
import { MetaMaskInpageProvider } from '@metamask/providers';
import { getActiveAccount, getNetwork, setRpcUrl } from './services';
import EventEmitter from 'events';

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
      minimalFee: Mas.fromString(res.minimalFees),
    };
  }

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
  public listenNetworkChanges(
    callback: (network: string) => void,
  ): { unsubscribe: () => void } | undefined {
    this.eventsListener.on(METAMASK_NETWORK_CHANGED, (evt) => callback(evt));

    // check periodically if network changed
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

  public async connect() {
    try {
      const isUnlocked = await isMetaMaskUnlocked();

      if (!isUnlocked) {
        await promptAndWaitForWalletUnlock();
      }

      const snap = await getMassaSnapInfo(this.metamaskProvider);

      if (!snap) {
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

  public connected(): boolean {
    return this.metamaskProvider.isConnected();
  }

  public enabled(): boolean {
    throw new Error('Method not implemented.');
  }
}
