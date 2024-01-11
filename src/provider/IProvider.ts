import { IAccountDeletionResponse } from './AccountDeletion';
import { IAccountImportResponse } from './AccountImport';
import { IAccount } from '../account/IAccount';
import { IAccountDetails } from '../account';

/**
 * This interface represents a general provider definition with its methods
 */
export interface IProvider {
  name(): string;
  accounts(): Promise<IAccount[]>;
  importAccount(
    publicKey: string,
    privateKey: string,
  ): Promise<IAccountImportResponse>;
  deleteAccount(address: string): Promise<IAccountDeletionResponse>;
  getNodesUrls(): Promise<string[]>;
  getNetwork(): Promise<string>;
  generateNewAccount(name: string): Promise<IAccountDetails>;
  listenAccountChanges(callback: (base58: string) => void):
    | {
        unsubscribe: () => void;
      }
    | undefined;
}
