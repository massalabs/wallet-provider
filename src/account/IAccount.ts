import { ITransactionDetails } from '..';
import { IAccountBalanceResponse } from './AccountBalance';
import { IAccountSignOutput } from './AccountSign';
import { Args, IContractReadOperationResponse } from '@massalabs/web3-utils';

/**
 * `IAccount` outlines the structure expected for an account.
 */
export interface IAccount {
  /**
   * Retrieves the account's address.
   *
   * @returns Account address as a string.
   */
  address(): string;

  /**
   * Retrieves the account's name.
   *
   * @returns Account name as a string.
   */
  name(): string;

  /**
   * Retrieves the name of the provider associated with the account.
   *
   * @returns Provider name as a string.
   */
  providerName(): string;

  /**
   * Initiates a request to retrieve the account's balance.
   *
   * @returns Promise resolving to an `IAccountBalanceResponse`.
   */
  balance(): Promise<IAccountBalanceResponse>;

  /**
   * Signs data.
   *
   * @param data - Data to be signed, can be of type Buffer, Uint8Array, or string.
   * @returns Promise resolving to an `IAccountSignOutput`.
   */
  sign(data: Buffer | Uint8Array | string): Promise<IAccountSignOutput>;

  /**
   * Purchases rolls.
   *
   * @param amount - Amount of rolls to purchase.
   * @param fee - Transaction fee.
   * @returns A promise resolving to an `ITransactionDetails` object.
   */
  buyRolls(amount: bigint, fee: bigint): Promise<ITransactionDetails>;

  /**
   * Sells rolls.
   *
   * @param amount - Amount of rolls to sell.
   * @param fee - Transaction fee.
   * @returns A promise resolving to an `ITransactionDetails` object.
   */
  sellRolls(amount: bigint, fee: bigint): Promise<ITransactionDetails>;

  /**
   * Sends a transaction.
   *
   * @param amount - Amount to send.
   * @param recipientAddress - Address of the recipient.
   * @param fee - Transaction fee.
   * @returns A promise resolving to an `ITransactionDetails` object.
   */
  sendTransaction(
    amount: bigint,
    recipientAddress: string,
    fee: bigint,
  ): Promise<ITransactionDetails>;

  /**
   * Calls a smart contract.
   *
   * @param contractAddress - Address of the smart contract.
   * @param functionName - Name of the function to call.
   * @param parameter - Parameters to pass to the function.
   * @param amount - Amount of funds to send with the call.
   * @param fee - Fee for the transaction.
   * @param maxGas - Maximum gas to use for the transaction.
   * @param nonPersistentExecution - Optional flag for non-persistent execution.
   */
  callSC(
    contractAddress: string,
    functionName: string,
    parameter: Uint8Array | Args,
    amount: bigint,
    fee: bigint,
    maxGas: bigint,
    nonPersistentExecution?: boolean,
  ): Promise<ITransactionDetails | IContractReadOperationResponse>;
}
