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
        (err, result) => {
          if (err) return reject(err);
          return resolve(result);
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
    accountImportRequest: IAccountImportRequest,
  ): Promise<IAccountImportResponse> {
    return new Promise<IAccountImportResponse>((resolve, reject) => {
      connector.sendMessageToContentScript(
        this.providerName,
        AvailableCommands.ProviderImportAccount,
        { ...accountImportRequest },
        (err, result) => {
          if (err) return reject(err);
          return resolve(result);
        },
      );
    });
  }

  public async deleteAccount(
    accountDeletionRequest: IAccountDeletionRequest,
  ): Promise<IAccountDeletionResponse> {
    return new Promise<IAccountDeletionResponse>((resolve, reject) => {
      connector.sendMessageToContentScript(
        this.providerName,
        AvailableCommands.ProviderDeleteAccount,
        { ...accountDeletionRequest },
        (err, result) => {
          if (err) return reject(err);
          return resolve(result);
        },
      );
    });
  }
}
