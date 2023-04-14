import {
  EAccountDeletionResponse,
  IAccountDeletionRequest,
  IAccountDeletionResponse,
} from '../provider/AccountDeletion';
import {
  IAccountImportRequest,
  IAccountImportResponse,
} from '../provider/AccountImport';
import { IProvider } from '../provider/IProvider';
import {
  JsonRpcResponseData,
  deleteRequest,
  getRequest,
} from './RequestHandler';
import { ThyraAccount } from './ThyraAccount';
import { IAccount } from '../account/IAccount';

export const THYRA_ACCOUNTS_URL =
  'https://my.massa/thyra/plugin/massalabs/wallet/rest/wallet';

export const THYRA_IMPORT_ACCOUNTS_URL = `${THYRA_ACCOUNTS_URL}/import/`;

export const THYRA_PROVIDER_NAME = 'THYRA';

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

export class ThyraProvider implements IProvider {
  private providerName: string;

  public constructor() {
    this.providerName = THYRA_PROVIDER_NAME;
  }

  public name(): string {
    return this.providerName;
  }

  public async accounts(): Promise<IAccount[]> {
    let thyraAccountsResponse: JsonRpcResponseData<Array<IThyraWallet>> = null;
    try {
      thyraAccountsResponse = await getRequest<Array<IThyraWallet>>(
        THYRA_ACCOUNTS_URL,
      );
    } catch (ex) {
      console.error(`Thyra accounts retrieval error`);
      throw ex;
    }
    if (thyraAccountsResponse.isError || thyraAccountsResponse.error) {
      throw thyraAccountsResponse.error.message;
    }
    return thyraAccountsResponse.result.map((thyraAccount) => {
      return new ThyraAccount(
        { address: thyraAccount.address, name: thyraAccount.nickname },
        this.providerName,
      );
    });
  }

  public async importAccount(
    publicKey: string,
    privateKey: string,
  ): Promise<IAccountImportResponse> {
    // TODO: cannot import as it goes over the popup dialog (need special url for that)
    return null;
  }

  public async deleteAccount(
    address: string,
  ): Promise<IAccountDeletionResponse> {
    // get all accounts
    let allAccounts: JsonRpcResponseData<Array<IThyraWallet>> = null;
    try {
      allAccounts = await getRequest<Array<IThyraWallet>>(THYRA_ACCOUNTS_URL);
    } catch (ex) {
      console.error(`Thyra accounts retrieval error`);
      throw ex;
    }
    if (allAccounts.isError || allAccounts.error) {
      throw allAccounts.error.message;
    }

    // find the account with the desired address
    const accountToDelete = allAccounts.result.find(
      (account) => account.address.toLowerCase() === address.toLowerCase(),
    );

    // delete the account in question
    let thyraAccountsResponse: JsonRpcResponseData<unknown> = null;
    try {
      thyraAccountsResponse = await deleteRequest<unknown>(
        `${THYRA_ACCOUNTS_URL}/${accountToDelete.nickname}`,
      );
    } catch (ex) {
      console.error(`Thyra accounts deletion error`, ex);
      return {
        response: EAccountDeletionResponse.ERROR,
      } as IAccountDeletionResponse;
    }
    if (thyraAccountsResponse.isError || thyraAccountsResponse.error) {
      console.error(
        `Thyra accounts deletion error`,
        thyraAccountsResponse.error.message,
      );
      return {
        response: EAccountDeletionResponse.ERROR,
      } as IAccountDeletionResponse;
    }
    return {
      response: EAccountDeletionResponse.OK,
    } as IAccountDeletionResponse;
  }
}
