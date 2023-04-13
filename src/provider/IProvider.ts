import { IAccountDeletionResponse } from './AccountDeletion';
import { IAccountImportResponse } from './AccountImport';
import { IAccount } from '../account/IAccount';

export interface IProvider {
  name(): string;
  accounts(): Promise<IAccount[]>;
  importAccount(
    publicKey: string,
    privateKey: string,
  ): Promise<IAccountImportResponse>;
  deleteAccount(address: string): Promise<IAccountDeletionResponse>;
}
