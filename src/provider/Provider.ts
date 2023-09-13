import {
  IAccountDeletionRequest,
  IAccountDeletionResponse,
} from './AccountDeletion';
import { IAccountImportRequest, IAccountImportResponse } from './AccountImport';
import { connector } from '../connector/Connector';
import { Account } from '../account/Account';
import { AvailableCommands } from '..';
import { IAccountDetails } from '../account/IAccountDetails';
import { IProvider } from './IProvider';
import { IAccount } from '../account/IAccount';
import { IAccountGenerationRequest } from './AccoutGeneration';

/**
 * The Provider class provides a simple and intuitive interface for interacting with a specific
 * wallet service.
 *
 */
export class Provider implements IProvider {
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

  /**
   * This method returns the name of the provider.
   * @returns The name of the provider.
   */
  public name(): string {
    return this.providerName;
  }

  /**
   * This method sends a message to the content script to get the list of accounts for the provider.
   * It returns a Promise that resolves to an array of Account instances.
   *
   * @returns A promise that resolves to an array of Account instances.
   */
  public async accounts(): Promise<IAccount[]> {
    const providersPromise = new Promise<IAccountDetails[]>(
      (resolve, reject) => {
        connector.sendMessageToContentScript(
          this.providerName,
          AvailableCommands.ProviderListAccounts,
          {},
          (result, err) => {
            if (err) return reject(err);
            return resolve(result as IAccountDetails[]);
          },
        );
      },
    );

    const providerAccounts: IAccountDetails[] = await providersPromise;

    let accounts: Account[] = [];
    for (const providerAccount of providerAccounts) {
      const accInstance = new Account(providerAccount, this.providerName);
      accounts.push(accInstance);
    }

    return accounts;
  }

  /**
   * This method sends a message to the content script to import an account with the given publicKey and privateKey.
   *
   * @remarks
   * - The IAccountImportResponse object contains the address of the imported account.
   * - The address is generated from the public key.
   *
   * @param publicKey - The public key of the account.
   * @param privateKey - The private key of the account.
   * @returns a Promise that resolves to an instance of IAccountImportResponse.
   *
   */
  public async importAccount(
    publicKey: string,
    privateKey: string,
  ): Promise<IAccountImportResponse> {
    const accountImportRequest = {
      publicKey,
      privateKey,
    } as IAccountImportRequest;
    return new Promise<IAccountImportResponse>((resolve, reject) => {
      connector.sendMessageToContentScript(
        this.providerName,
        AvailableCommands.ProviderImportAccount,
        accountImportRequest,
        (result, err) => {
          if (err) return reject(err);
          return resolve(result as IAccountImportResponse);
        },
      );
    });
  }

  /**
   * This method sends a message to the content script to delete the account associated with the given address.
   *
   * @param address - The address of the account.
   * @returns a Promise that resolves to an instance of IAccountDeletionResponse.
   */
  public async deleteAccount(
    address: string,
  ): Promise<IAccountDeletionResponse> {
    const accountDeletionRequest = { address } as IAccountDeletionRequest;
    return new Promise<IAccountDeletionResponse>((resolve, reject) => {
      connector.sendMessageToContentScript(
        this.providerName,
        AvailableCommands.ProviderDeleteAccount,
        accountDeletionRequest,
        (result, err) => {
          if (err) return reject(err);
          return resolve(result as IAccountDeletionResponse);
        },
      );
    });
  }

  /**
   * This method sends a message to the content script to get the list of nodes urls
   * used to connect the front end to the Massa network.
   *
   * @returns a Promise that resolves to an array of nodes urls (string).
   *
   */
  public async getNodesUrls(): Promise<string[]> {
    return new Promise<string[]>((resolve, reject) => {
      connector.sendMessageToContentScript(
        this.providerName,
        AvailableCommands.ProviderGetNodesUrls,
        {},
        (result, err) => {
          if (err) return reject(err);
          return resolve(result as string[]);
        },
      );
    });
  }

  // Get network
  /**
   * This method sends a message to the content script to get the used network name.
   *
   * @returns a Promise that resolves to the network name (string).
   */
  public async getNetwork(): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      connector.sendMessageToContentScript(
        this.providerName,
        AvailableCommands.ProviderGetNetwork,
        {},
        (result, err) => {
          if (err) return reject(err);
          else if (typeof result !== 'string') {
            return reject(
              new Error(`Expected a string but got ${typeof result} instead`),
            );
          }
          return resolve(result);
        },
      );
    });
  }

  /**
   * This method generates a new account by a given name and adds it to the wallet.
   *
   * @param name - The account name
   * @returns a Promise that resolves to an instance of IAccountDetails.
   */
  public async generateNewAccount(name?: string): Promise<IAccountDetails> {
    const accountGenerationRequest = { name } as IAccountGenerationRequest;
    return new Promise<IAccountDetails>((resolve, reject) => {
      connector.sendMessageToContentScript(
        this.providerName,
        AvailableCommands.ProviderGenerateNewAccount,
        accountGenerationRequest,
        (result, err) => {
          if (err) return reject(err);
          return resolve(result as IAccountDetails);
        },
      );
    });
  }
}
