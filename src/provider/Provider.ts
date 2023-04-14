import {
  IAccountDeletionRequest,
  IAccountDeletionResponse,
} from './AccountDeletion';
import { IAccountImportRequest, IAccountImportResponse } from './AccountImport';
import { connector } from '../connector/Connector';
import { Account } from '../account/Account';
import { AvailableCommands } from '..';
import { IAccount } from '../account/IAccount';

/**
 * Provider class
 *
 */
export class Provider {
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
  public async accounts(): Promise<Account[]> {
    const providersPromise = new Promise<IAccount[]>((resolve, reject) => {
      connector.sendMessageToContentScript(
        this.providerName,
        AvailableCommands.ProviderListAccounts,
        {},
        (result, err) => {
          if (err) return reject(err);
          return resolve(result as IAccount[]);
        },
      );
    });

    const providerAccounts: IAccount[] = await providersPromise;

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
   * @param publicKey - The public key of the account.
   * @param privateKey - The private key of the account.
   * @returns a Promise that resolves to an instance of IAccountImportResponse.
   *
   * @remarks
   * - The IAccountImportResponse object contains the address of the imported account.
   * - The address is generated from the public key.
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
}
