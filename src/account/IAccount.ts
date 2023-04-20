import { ITransactionDetails } from '..';
import { IAccountBalanceResponse } from './AccountBalance';
import { IAccountSignResponse } from './AccountSign';

/**
 * This interface represents an Account object.
 */
export interface IAccount {
  address(): string;
  name(): string;
  providerName(): string;
  balance(): Promise<IAccountBalanceResponse>;
  sign(data: Uint8Array | string): Promise<IAccountSignResponse>;
  buyRolls(amount: string, fee: string): Promise<ITransactionDetails>;
  sellRolls(amount: string, fee: string): Promise<ITransactionDetails>;
  sendTransaction(
    amount: string,
    recipientAddress: string,
    fee: string,
  ): Promise<ITransactionDetails>;
}
