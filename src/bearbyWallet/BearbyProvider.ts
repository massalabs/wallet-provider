import { web3 } from '@hicaru/bearby.js';
import { IAccount, IAccountDetails } from '../account';
import {
  IAccountDeletionResponse,
  IAccountImportResponse,
  IProvider,
} from '../provider';
import { BearbyAccount } from './BearbyAccount';

export class BearbyProvider implements IProvider {
  private providerName: string;

  /**
   * Provider constructor
   *
   * @param providerName - The name of the provider.
   * @returns An instance of the Provider class.
   */
  public constructor(providerName: string) {
    this.providerName = providerName;
  }

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
    return ['https://buildnet.massa.net/api/v2'];
  }

  public async generateNewAccount(name: string): Promise<IAccountDetails> {
    throw new Error('Method not implemented.');
  }
}
