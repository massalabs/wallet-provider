/**
 * This interface represents an Account object.
 */
import { IAccountBalanceResponse } from './AccountBalance';
import { IAccountSignResponse } from './AccountSign';

export interface IAccount {
  address(): string;
  name(): string;
  providerName(): string;
  balance(): Promise<IAccountBalanceResponse>;
  sign(data: Uint8Array | string): Promise<IAccountSignResponse>;
}
