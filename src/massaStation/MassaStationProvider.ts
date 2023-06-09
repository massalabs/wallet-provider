import {
  EAccountDeletionResponse,
  IAccountDeletionResponse,
} from '../provider/AccountDeletion';
import {
  IAccountImportResponse,
  EAccountImportResponse,
  IAccountImportRequest,
} from '../provider/AccountImport';
import { IProvider } from '../provider/IProvider';
import {
  JsonRpcResponseData,
  deleteRequest,
  getRequest,
  postRequest,
  putRequest,
} from './RequestHandler';
import { MassaStationAccount } from './MassaStationAccount';
import { IAccount } from '../account/IAccount';
import { IAccountDetails } from '../account';

/**
 * MassaStation url
 */
export const MASSA_STATION_URL = 'https://station.massa/';

/**
 * The MassaStation accounts url
 */
export const MASSA_STATION_ACCOUNTS_URL = `${MASSA_STATION_URL}plugin/massa-labs/massa-wallet/api/accounts`;

/**
 * MassaStation's url for importing accounts
 */
export const MASSA_STATION_IMPORT_ACCOUNTS_URL = `${MASSA_STATION_ACCOUNTS_URL}/import/`;

/**
 * MassaStation's wallet provider name
 */
export const MASSA_STATION_PROVIDER_NAME = 'MASSASTATION';

/**
 * This interface represents the payload returned by making a call to MassaStation's accounts url.
 */
export interface IMassaStationWallet {
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
 * This class provides an implementation for communicating with the MassaStation wallet provider.
 * @remarks
 * This class is used as a proxy to the MassaStation server for exchanging message over https calls.
 */
export class MassaStationProvider implements IProvider {
  private providerName: string;

  /**
   * Provider constructor
   *
   * @param providerName - The name of the provider.
   * @returns An instance of the Provider class.
   */
  public constructor() {
    this.providerName = MASSA_STATION_PROVIDER_NAME;
  }

  /**
   * This method returns the name of the provider.
   * @returns The name of the provider.
   */
  public name(): string {
    return this.providerName;
  }

  /**
   * This method sends a message to the MassaStation server to get the list of accounts for the provider.
   * It returns a Promise that resolves to an array of Account instances.
   *
   * @returns A promise that resolves to an array of Account instances.
   */
  public async accounts(): Promise<IAccount[]> {
    let massaStationAccountsResponse: JsonRpcResponseData<
      Array<IMassaStationWallet>
    > = null;
    try {
      massaStationAccountsResponse = await getRequest<
        Array<IMassaStationWallet>
      >(MASSA_STATION_ACCOUNTS_URL);
    } catch (ex) {
      console.error(`MassaStation accounts retrieval error`);
      throw ex;
    }
    if (
      massaStationAccountsResponse.isError ||
      massaStationAccountsResponse.error
    ) {
      throw massaStationAccountsResponse.error.message;
    }
    return massaStationAccountsResponse.result.map((massaStationAccount) => {
      return new MassaStationAccount(
        {
          address: massaStationAccount.address,
          name: massaStationAccount.nickname,
        },
        this.providerName,
      );
    });
  }

  /**
   * This method makes an http call to the MassaStation server to import an account with
   * the given publicKey and privateKey.
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
    let massaStationAccountsResponse: JsonRpcResponseData<unknown> = null;
    try {
      massaStationAccountsResponse = await putRequest<unknown>(
        MASSA_STATION_ACCOUNTS_URL,
        accountImportRequest,
      );
    } catch (ex) {
      console.log(`MassaStation accounts retrieval error: ${ex}`);
      throw ex;
    }
    if (
      massaStationAccountsResponse.isError ||
      massaStationAccountsResponse.error
    ) {
      throw massaStationAccountsResponse.error.message;
    }
    return {
      response: EAccountImportResponse.OK,
      message: 'Account imported successfully',
    } as IAccountImportResponse;
  }

  /**
   * This method sends an http call to the MassaStation server to delete the account associated with the given address.
   *
   * @param address - The address of the account.
   * @returns a Promise that resolves to an instance of IAccountDeletionResponse.
   */
  public async deleteAccount(
    address: string,
  ): Promise<IAccountDeletionResponse> {
    // get all accounts
    let allAccounts: JsonRpcResponseData<Array<IMassaStationWallet>> = null;
    try {
      allAccounts = await getRequest<Array<IMassaStationWallet>>(
        MASSA_STATION_ACCOUNTS_URL,
      );
    } catch (ex) {
      console.log(`MassaStation accounts retrieval error: ${ex}`);
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
    let massaStationAccountsResponse: JsonRpcResponseData<unknown> = null;
    try {
      massaStationAccountsResponse = await deleteRequest<unknown>(
        `${MASSA_STATION_ACCOUNTS_URL}/${accountToDelete.nickname}`,
      );
    } catch (ex) {
      console.log(`MassaStation accounts deletion error`, ex);
      return {
        response: EAccountDeletionResponse.ERROR,
      } as IAccountDeletionResponse;
    }
    if (
      massaStationAccountsResponse.isError ||
      massaStationAccountsResponse.error
    ) {
      console.log(
        `MassaStation accounts deletion error`,
        massaStationAccountsResponse.error.message,
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
   * This method sends an http call to the MassaStation server to obtain node urls.
   *
   * @returns a Promise that resolves to a list of node urls.
   */
  public async getNodesUrls(): Promise<string[]> {
    let nodesResponse: JsonRpcResponseData<unknown> = null;
    try {
      nodesResponse = await getRequest<unknown>(
        `${MASSA_STATION_URL}massa/node`,
      );
      if (nodesResponse.isError || nodesResponse.error) {
        throw nodesResponse.error.message;
      }
      // transform nodesResponse.result to a json and then get the "url" property
      const nodes = nodesResponse.result as { url: string };
      return Array(nodes.url);
    } catch (ex) {
      console.error(`MassaStation nodes retrieval error`, ex);
      throw ex;
    }
  }

  /**
   * This method sends an http call to the MassaStation server to create a new random account.
   *
   * @returns a Promise that resolves to the details of the newly generated account.
   */
  public async generateNewAccount(name: string): Promise<IAccountDetails> {
    let massaStationAccountsResponse: JsonRpcResponseData<IMassaStationWallet> =
      null;
    console.log(MASSA_STATION_ACCOUNTS_URL + '/' + name);
    try {
      massaStationAccountsResponse = await postRequest<IMassaStationWallet>(
        MASSA_STATION_ACCOUNTS_URL + '/' + name,
        {},
      );
      if (
        massaStationAccountsResponse.isError ||
        massaStationAccountsResponse.error
      ) {
        throw massaStationAccountsResponse.error.message;
      }
      return {
        address: massaStationAccountsResponse.result.address,
        name: massaStationAccountsResponse.result.nickname,
      } as IAccountDetails;
    } catch (ex) {
      console.error(`Error while generating account: ${ex}`);
      throw ex;
    }
  }
}
