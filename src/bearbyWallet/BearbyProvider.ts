import {
  JsonRPCResponse,
  JsonRPCResponseNodeStatus,
  web3,
} from '@hicaru/bearby.js';
import { IAccount, IAccountDetails } from '../account';
import {
  IAccountDeletionResponse,
  IAccountImportResponse,
  IProvider,
} from '../provider';
import { BearbyAccount } from './BearbyAccount';
import { CHAIN_ID_RPC_URL_MAP } from '@massalabs/web3-utils';

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
    return [CHAIN_ID_RPC_URL_MAP[chainId.toString()]];
  }

  public async getChainId(): Promise<bigint> {
    // TODO: remove any when bearby.js is updated https://github.com/bearby-wallet/bearby-web3/issues/10
    const info = (await web3.massa.getNodesStatus()) as any;
    return BigInt(info.result.chain_id);
  }

  public async getNetwork(): Promise<string> {
    const network = await web3.wallet.network;
    return network.net;
  }

  // TODO: Harmonize the response with other providers
  public async getNodeStatus(): Promise<
    JsonRPCResponse<JsonRPCResponseNodeStatus>
  > {
    return web3.massa.getNodesStatus();
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
  public connected(): boolean {
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
