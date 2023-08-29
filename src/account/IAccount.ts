import { ITransactionDetails } from '..';
import { IAccountBalanceResponse } from './AccountBalance';
import { IAccountSignOutput } from './AccountSign';
import { Args, IContractReadOperationResponse } from '@massalabs/web3-utils';
import { IContractData } from './IContractData';

/**
 * This interface represents an Account object.
 *
 */
export interface IAccount {
  address(): string;
  name(): string;
  providerName(): string;
  balance(): Promise<IAccountBalanceResponse>;
  sign(data: Buffer | Uint8Array | string): Promise<IAccountSignOutput>;
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
    fee: bigint,
    maxGas: bigint,
    nonPersistentExecution?: boolean,
  ): Promise<ITransactionDetails | IContractReadOperationResponse>;
  deploySC(contractData: IContractData): Promise<ITransactionDetails>;
}
