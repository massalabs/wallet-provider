import { ITransactionDetails } from '..';
import { IAccountBalanceResponse } from './AccountBalance';
import { IAccountSignResponse } from './AccountSign';
import { Args } from '@massalabs/massa-web3';
import { NonPersistentExecution } from './INonPersistentExecution';

/**
 * This interface represents an Account object.
 *
 */
export interface IAccount {
  address(): string;
  name(): string;
  providerName(): string;
  balance(): Promise<IAccountBalanceResponse>;
  sign(data: Uint8Array | string): Promise<IAccountSignResponse>;
  buyRolls(amount: bigint, fee: bigint): Promise<ITransactionDetails>;
  sellRolls(amount: bigint, fee: bigint): Promise<ITransactionDetails>;
  sendTransaction(
    amount: bigint,
    recipientAddress: string,
    fee: bigint,
  ): Promise<ITransactionDetails>;
  callSC(
    contractAddress: string,
    functionName: string,
    parameter: Uint8Array | Args,
    amount: bigint,
    nonPersistentExecution?: NonPersistentExecution,
  );
}
