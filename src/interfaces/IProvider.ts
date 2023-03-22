import { IAccount } from './IAccount';

export interface IProvider {
  name(): string;
  accounts(): Promise<IAccount[]>;
  importAccount(): Promise<IAccount>;
  deleteAccount(account: IAccount): Promise<void>;
}
