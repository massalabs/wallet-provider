import {
  IAccountDeletionResponse,
} from './AccountDeletion';
import { IAccountImportResponse } from './AccountImport';
import { Account } from '../account/Account';
  
export interface IProvider {
  name(): string;
  accounts(): Promise<Account[]>;
  importAccount(
    publicKey: string,
    privateKey: string,
  ): Promise<IAccountImportResponse>;
  deleteAccount(
    address: string,
  ): Promise<IAccountDeletionResponse>;
}
  