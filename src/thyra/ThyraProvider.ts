import {
  EAccountDeletionResponse,
  IAccountDeletionResponse,
} from '../provider/AccountDeletion';
import { IAccountImportResponse } from '../provider/AccountImport';
import { IProvider } from '../provider/IProvider';
import {
  JsonRpcResponseData,
  deleteRequest,
  getRequest,
  postRequest,
  putRequest,
} from './RequestHandler';
import { ThyraAccount } from './ThyraAccount';
import { IAccount } from '../account/IAccount';
import { IAccountDetails } from '../account';

/**
 * The Thyra accounts url
 */
export const THYRA_ACCOUNTS_URL =
  'https://my.massa/thyra/plugin/massalabs/wallet/api/accounts';

/**
 * Thyra's url for importing accounts
 */
export const THYRA_IMPORT_ACCOUNTS_URL = `${THYRA_ACCOUNTS_URL}/import/`;

/**
 * Thyra's wallet provider name
 */
export const THYRA_PROVIDER_NAME = 'THYRA';

/**
 * This interface represents the payload returned by making a call to Thyra's accounts url.
 */
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

/**
 * This class provides an implementation for communicating with the Thyra wallet provider.
 * @remarks
 * This class is used as a proxy to the Thyra server for exchanging message over https calls.
 */
export class ThyraProvider implements IProvider {
  private providerName: string;

  /**
   * Provider constructor
   *
   * @param providerName - The name of the provider.
   * @returns An instance of the Provider class.
   */
  public constructor() {
    this.providerName = THYRA_PROVIDER_NAME;
  }

  /**
   * This method returns the name of the provider.
   * @returns The name of the provider.
   */
  public name(): string {
    return this.providerName;
  }

  /**
   * This method sends a message to the Thyra server to get the list of accounts for the provider.
   * It returns a Promise that resolves to an array of Account instances.
   *
   * @returns A promise that resolves to an array of Account instances.
   */
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

  /**
   * This method makes an http call to the Thyra server to import an account with the given publicKey and privateKey.
   *
   * @param publicKey - The public key of the account.
   * @param privateKey - The private key of the account.
   *
   * @returns a Promise that resolves to an instance of IAccountImportResponse.
   */
  public async importAccount(
    publicKey: string,
    privateKey: string,
  ): Promise<IAccountImportResponse> {
    const accountImportRequest: IAccountImportRequest = {
      publicKey,
      privateKey,
    };
    let thyraAccountsResponse: JsonRpcResponseData<unknown> = null;
    try {
      thyraAccountsResponse = await putRequest<unknown>(
        THYRA_ACCOUNTS_URL,
        accountImportRequest,
      );
    } catch (ex) {
      console.log(`Thyra accounts retrieval error: ${ex}`);
      throw ex;
    }
    if (thyraAccountsResponse.isError || thyraAccountsResponse.error) {
      throw thyraAccountsResponse.error.message;
    }
    return {
      response: EAccountImportResponse.OK,
      message: 'Account imported successfully',
    } as IAccountImportResponse;
  }

  /**
   * This method sends an http call to the Thyra server to delete the account associated with the given address.
   *
   * @param address - The address of the account.
   * @returns a Promise that resolves to an instance of IAccountDeletionResponse.
   */
  public async deleteAccount(
    address: string,
  ): Promise<IAccountDeletionResponse> {
    // get all accounts
    let allAccounts: JsonRpcResponseData<Array<IThyraWallet>> = null;
    try {
      allAccounts = await getRequest<Array<IThyraWallet>>(THYRA_ACCOUNTS_URL);
    } catch (ex) {
      console.log(`Thyra accounts retrieval error: ${ex}`);
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
        `${THYRA_ACCOUNTS_URL}${accountToDelete.nickname}`,
      );
    } catch (ex) {
      console.log(`Thyra accounts deletion error`, ex);
      return {
        response: EAccountDeletionResponse.ERROR,
      } as IAccountDeletionResponse;
    }
    if (thyraAccountsResponse.isError || thyraAccountsResponse.error) {
      console.log(
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

  /**
   * This method sends an http call to the Thyra server to obtain node urls.
   *
   * @returns a Promise that resolves to a list of node urls.
   */
  public async getNodesUrls(): Promise<string[]> {
    let nodesResponse: JsonRpcResponseData<unknown> = null;
    try {
      nodesResponse = await getRequest<unknown>(`${THYRA_URL}/massa/node`);
      if (nodesResponse.isError || nodesResponse.error) {
        throw nodesResponse.error.message;
      }
      // transform nodesResponse.result to a json and then get the "url" property
      const nodes = nodesResponse.result as { url: string };
      return Array(nodes.url);
    } catch (ex) {
      console.error(`Thyra nodes retrieval error`, ex);
      throw ex;
    }
  }

  /**
   * This method sends an http call to the Thyra server to create a new random account.
   *
   * @returns a Promise that resolves to the details of the newly generated account.
   */
  public async generateNewAccount(name: string): Promise<IAccountDetails> {
    throw new Error('Method not implemented.');
  }
}
