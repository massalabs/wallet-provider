import {
  IAccountDeletionRequest,
  IAccountDeletionResponse,
} from '../provider/AccountDeletion';
import {
  IAccountImportRequest,
  IAccountImportResponse,
} from '../provider/AccountImport';
import { Account } from '../account/Account';
import { IAccount } from '../account/IAccount';
import { IProvider } from '../provider/IProvider';
import { JsonRpcResponseData, getRequest } from './RequestHandler';

const THYRA_ACCOUNTS_URL =
  'https://my.massa/thyra/plugin/massalabs/wallet/rest/wallet/';

export interface IThyraWallet {
  address: string;
  nickname: string;
  keyPair: {
    nonce: string;
    privateKey: string;
    publicKey: string;
    salt: string;
  };
}

export const THYRA_PROVIDER_NAME = 'THYRA';

export class ThyraProvider implements IProvider {
  private providerName: string;

  public constructor() {
    this.providerName = THYRA_PROVIDER_NAME;
  }

  public name(): string {
    return this.providerName;
  }

  public async accounts(): Promise<Account[]> {
    let thyraAccountsResponse: JsonRpcResponseData<Array<IThyraWallet>> = null;
    try {
      thyraAccountsResponse = await getRequest<Array<IThyraWallet>>(
        THYRA_ACCOUNTS_URL,
      );
    } catch (ex) {
      console.error(`Thyra accounts retrieval error`);
    }
    if (thyraAccountsResponse.isError || thyraAccountsResponse.error) {
      throw thyraAccountsResponse.error.message;
    }
    const thyraAccounts: IThyraWallet[] = thyraAccountsResponse.result;
    let accounts: Account[] = [];
    for (const thyraAccount of thyraAccounts) {
      const accInstance = new Account(
        { address: thyraAccount.address, name: thyraAccount.nickname },
        this.providerName,
      );
      accounts.push(accInstance);
    }
    return accounts;
  }

  public async importAccount(
    publicKey: string,
    privateKey: string,
  ): Promise<IAccountImportResponse> {
    return null;
  }

  public async deleteAccount(
    address: string,
  ): Promise<IAccountDeletionResponse> {
    return null;
  }
}
