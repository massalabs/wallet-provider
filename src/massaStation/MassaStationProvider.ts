import {
  EAccountDeletionResponse,
  IAccountDeletionResponse,
} from '../provider/AccountDeletion';
import {
  IAccountImportResponse,
  EAccountImportResponse,
  IAccountImportRequest,
} from '../provider/AccountImport';
import { INetwork, IProvider } from '../provider/IProvider';
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
import { getNetworkInfoBody } from './types';
import EventEmitter from 'events';

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
 * Events emitted by MassaStation
 */
const MASSA_STATION_NETWORK_CHANGED = 'MASSA_STATION_NETWORK_CHANGED';

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
  status: MassaStationAccountStatus;
}

enum MassaStationAccountStatus {
  OK = 'ok',
  CORRUPTED = 'corrupted',
}

/**
 * This class provides an implementation for communicating with the MassaStation wallet provider.
 * @remarks
 * This class is used as a proxy to the MassaStation server for exchanging message over https calls.
 */
export class MassaStationProvider implements IProvider {
  private providerName = MASSA_STATION_PROVIDER_NAME;

  private massaStationEventsListener = new EventEmitter();
  private currentNetwork: INetwork;

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
    if (massaStationAccountsResponse.isError) {
      throw massaStationAccountsResponse.error.message;
    }
    return massaStationAccountsResponse.result
      .filter((massaStationAccount) => {
        return massaStationAccount.status === MassaStationAccountStatus.OK;
      })
      .map((massaStationAccount) => {
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
      massaStationAccountsResponse = await putRequest(
        MASSA_STATION_ACCOUNTS_URL,
        accountImportRequest,
      );
    } catch (error) {
      // TODO: Create custom error instead of logging
      console.log(`MassaStation accounts retrieval error: ${error}`);
      throw error;
    }

    if (massaStationAccountsResponse.isError) {
      throw massaStationAccountsResponse.error.message;
    }

    return {
      response: EAccountImportResponse.OK,
      message: 'Account imported successfully',
    };
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

    if (allAccounts.isError) throw allAccounts.error.message;

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
      };
    }
    if (massaStationAccountsResponse.isError) {
      console.log(
        `MassaStation accounts deletion error`,
        massaStationAccountsResponse.error.message,
      );
      return { response: EAccountDeletionResponse.ERROR };
    }
    return {
      response: EAccountDeletionResponse.OK,
    };
  }

  /**
   * This method sends an http call to the MassaStation server to obtain node urls.
   *
   * @throws an error if the call fails.
   *
   * @returns a Promise that resolves to a list of node urls.
   */
  public async getNodesUrls(): Promise<string[]> {
    let nodesResponse: JsonRpcResponseData<unknown> = null;
    try {
      nodesResponse = await getRequest<unknown>(
        `${MASSA_STATION_URL}massa/node`,
      );
      if (nodesResponse.isError) {
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
   * Returns the name of the network MassaStation is connected to.
   *
   * @throws an error if the call fails.
   *
   * @returns a Promise that resolves to a network.
   */
  public async getNetwork(): Promise<string> {
    try {
      const nodesResponse = await getRequest<getNetworkInfoBody>(
        `${MASSA_STATION_URL}massa/node`,
      );
      if (nodesResponse.isError) throw nodesResponse.error.message;

      if (this.currentNetwork?.name !== nodesResponse.result.network) {
        this.currentNetwork = {
          name: nodesResponse.result.network,
          url: nodesResponse.result.url,
          chainId: BigInt(nodesResponse.result.chainId),
        };
      }
      const nodes = nodesResponse.result;

      return nodes.network;
    } catch (ex) {
      console.error(`MassaStation nodes retrieval error`, ex);
      throw ex;
    }
  }

  /**
   * Returns the chain id of the network MassaStation is connected to.
   *
   * @throws an error if the call fails.
   *
   * @returns a Promise that resolves to a chain id.
   */
  public async getChainId(): Promise<bigint> {
    try {
      const nodesResponse = await getRequest<getNetworkInfoBody>(
        `${MASSA_STATION_URL}massa/node`,
      );

      if (nodesResponse.isError) throw nodesResponse.error.message;

      const nodes = nodesResponse.result;

      return BigInt(nodes.chainId);
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
    let response: JsonRpcResponseData<IMassaStationWallet> = null;
    try {
      response = await postRequest<IMassaStationWallet>(
        MASSA_STATION_ACCOUNTS_URL + '/' + name,
        {},
      );
      if (response.isError) throw response.error.message;

      return {
        address: response.result.address,
        name: response.result.nickname,
      };
    } catch (ex) {
      console.error(`Error while generating account: ${ex}`);
      throw ex;
    }
  }

  public listenAccountChanges(): { unsubscribe: () => void } | undefined {
    throw new Error(
      'listenAccountChanges is not yet implemented for the current provider.',
    );
  }

  public listenNetworkChanges(
    callback: (network: string) => void,
  ): { unsubscribe: () => void } | undefined {
    this.massaStationEventsListener.on(MASSA_STATION_NETWORK_CHANGED, (evt) =>
      callback(evt),
    );

    // check periodically if network changed
    const intervalId = setInterval(async () => {
      const currentNetwork = this.currentNetwork?.name;
      const network = await this.getNetwork();
      if (currentNetwork !== network) {
        this.massaStationEventsListener.emit(
          MASSA_STATION_NETWORK_CHANGED,
          network,
        );
      }
    }, 500);

    return {
      unsubscribe: () => {
        clearInterval(intervalId);
        this.massaStationEventsListener.removeListener(
          MASSA_STATION_NETWORK_CHANGED,
          // eslint-disable-next-line @typescript-eslint/no-empty-function
          () => {},
        );
      },
    };
  }

  public async connect(): Promise<boolean> {
    throw new Error(
      'connect functionality is not yet implemented for the current provider.',
    );
  }

  public async disconnect(): Promise<boolean> {
    throw new Error(
      'disconnect functionality is not yet implemented for the current provider.',
    );
  }

  public connected(): boolean {
    throw new Error(
      'connected functionality is not yet implemented for the current provider.',
    );
  }

  public enabled(): boolean {
    throw new Error(
      'enabled functionality is not yet implemented for the current provider.',
    );
  }
}
