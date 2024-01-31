import { web3 } from '@hicaru/bearby.js';
import { IAccount, IAccountDetails } from '../account';
import {
  IAccountDeletionResponse,
  IAccountImportResponse,
  IProvider,
} from '../provider';
import { BearbyAccount } from './BearbyAccount';
import { getRpcByChainId } from './helpers';

export class BearbyProvider implements IProvider {
  private providerName = 'BEARBY';

  public name(): string {
    return this.providerName;
  }

  public async accounts(): Promise<IAccount[]> {
    // check if bearby is unlocked
    if (!web3.wallet.connected) {
      await web3.wallet.connect();
    }

    const account = {
      address: await web3.wallet.account.base58,
      name: 'BEARBY',
    };
    return [new BearbyAccount(account, this.providerName)];
  }

  public async importAccount(
    publicKey: string,
    privateKey: string,
  ): Promise<IAccountImportResponse> {
    throw new Error('Method not implemented.');
  }

  public async deleteAccount(
    address: string,
  ): Promise<IAccountDeletionResponse> {
    throw new Error('Method not implemented.');
  }

  public async getNodesUrls(): Promise<string[]> {
    const chainId = await this.getChainId();
    // TODO: Check why we need to put in an array
    return [getRpcByChainId(chainId)];
  }

  public async getChainId(): Promise<bigint> {
    // TODO: remove any when bearby.js is updated https://github.com/bearby-wallet/bearby-web3/issues/10
    const info = (await web3.massa.getNodesStatus()) as any;
    return BigInt(info.result.chainId);
  }

  public async getNetwork(): Promise<string> {
    const network = await web3.wallet.network;
    return network.net;
  }

  public async generateNewAccount(name: string): Promise<IAccountDetails> {
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
  public listenAccountChanges(callback: (base58: string) => void): {
    unsubscribe: () => void;
  } {
    return web3.wallet.account.subscribe((base58) => callback(base58));
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

  public async connect() {
    return web3.wallet.connect();
  }

  public async disconnect() {
    return web3.wallet.disconnect();
  }

  public connected(): boolean {
    return web3.wallet.connected;
  }

  public enabled(): boolean {
    return web3.wallet.enabled;
  }
}
