import {
  IAccountDeletionRequest,
  IAccountDeletionResponse,
} from '../provider/AccountDeletion';
import { IAccountImportRequest, IAccountImportResponse } from '../provider/AccountImport';
import { Account } from '../account/Account';
import { IAccount } from '../account/IAccount';
import { IProvider } from '../provider/IProvider';

export const THYRA_PROVIDER_NAME = "THYRA";

export class ThyraProvider implements IProvider {
  private providerName: string;

  public constructor() {
    this.providerName = THYRA_PROVIDER_NAME;
  }

  public name(): string {
    return this.providerName;
  }

  public async accounts(): Promise<Account[]> {
    // TODO


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
