import {
  IAccountDeletionRequest,
  IAccountDeletionResponse,
} from './AccountDeletion';
import { IAccountImportRequest, IAccountImportResponse } from './AccountImport';
import { connector } from '../connector/Connector';
import { Account } from '../account/Account';
import { AvailableCommands } from '..';
import { IAccount } from '../account/IAccount';

export class Provider {
  private providerName: string;

  public constructor(providerName: string) {
    this.providerName = providerName;
  }

  public name(): string {
    return this.providerName;
  }

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
