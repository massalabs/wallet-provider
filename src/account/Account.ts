import {
  IAccountBalanceRequest,
  IAccountBalanceResponse,
} from './AccountBalance';
import { IAccountSignOutput, IAccountSignRequest } from './AccountSign';
import { connector } from '../connector/Connector';
import { IAccountDetails } from './IAccountDetails';
import { AvailableCommands, ITransactionDetails } from '..';
import { IAccount } from './IAccount';
import { IAccountRollsRequest } from './IAccountRolls';
import { IAccountSendTransactionRequest } from './IAccountSendTransaction';
import { IAccountCallSCRequest } from './IAccountCallSCRequest';
import { Args, IContractReadOperationResponse } from '@massalabs/web3-utils';

/**
 * The Account class represents a wallet account. It provides methods for interacting
 * with the account's balance and for signing messages.
 */
export class Account implements IAccount {
  private _providerName: string;
  private _address: string;
  private _name: string;

  /**
   * Initializes a new instance of the Account class.
   *
   * @param address - Account address.
   * @param name - Account name.
   * @param providerName - Blockchain provider name.
   *
   * @remarks
   * - Utilizes  IAccountDetails for account information and a providerName string for blockchain interaction.
   * - The providerName string identifies the provider that is used to interact with the blockchain.
   */

  public constructor({ address, name }: IAccountDetails, providerName: string) {
    this._address = address;
    this._name = name ?? '';
    this._providerName = providerName;
  }

  /**
   * @returns The address of the account.
   */
  public address(): string {
    return this._address;
  }

  /**
   * @returns The name of the account.
   */
  public name(): string {
    return this._name;
  }

  /**
   * @returns The name of the provider.
   */
  public providerName(): string {
    return this._providerName;
  }

  /**
   * Retrieves the account balance.
   *
   * @returns A promise that resolves to an object of type  IAccountBalanceResponse.
   */
  public async balance(): Promise<IAccountBalanceResponse> {
    return new Promise<IAccountBalanceResponse>((resolve, reject) => {
      connector.sendMessageToContentScript(
        this._providerName,
        AvailableCommands.AccountBalance,
        { address: this._address },
        (result, err) => {
          if (err) return reject(err);
          return resolve(result as IAccountBalanceResponse);
        },
      );
    });
  }

  /**
   * Signs a provided message.
   *
   * @param data - Message to sign.
   * @returns An  IAccountSignOutput object which contains the signature and the public key.
   */
  public async sign(data: Buffer | Uint8Array): Promise<IAccountSignOutput> {
    return new Promise<IAccountSignOutput>((resolve, reject) => {
      connector.sendMessageToContentScript(
        this._providerName,
        AvailableCommands.AccountSign,
        { address: this._address, data },
        (result, err) => {
          if (err) return reject(err);
          return resolve(result as IAccountSignOutput);
        },
      );
    });
  }

  /**
   * Purchases rolls for the sender.
   *
   * @param amount - Number of rolls to purchase.
   * @param fee - Transaction execution fee (in smallest unit).
   * @returns A promise resolving to an  ITransactionDetails containing the network operation ID.
   */
  public async buyRolls(
    amount: bigint,
    fee: bigint,
  ): Promise<ITransactionDetails> {
    return new Promise<ITransactionDetails>((resolve, reject) => {
      connector.sendMessageToContentScript(
        this._providerName,
        AvailableCommands.AccountBuyRolls,
        {
          amount: amount.toString(),
          fee: fee.toString(),
        },
        (result, err) => {
          if (err) return reject(err);
          return resolve(result as ITransactionDetails);
        },
      );
    });
  }

  /**
   * Sells rolls on behalf of the sender.
   *
   * @param amount - Number of rolls to sell.
   * @param fee - Transaction execution fee  (in smallest unit).
   * @returns A promise resolving to an  ITransactionDetails containing the network operation ID.
   */
  public async sellRolls(
    amount: bigint,
    fee: bigint,
  ): Promise<ITransactionDetails> {
    return new Promise<ITransactionDetails>((resolve, reject) => {
      connector.sendMessageToContentScript(
        this._providerName,
        AvailableCommands.AccountSellRolls,
        {
          amount: amount.toString(),
          fee: fee.toString(),
        },
        (result, err) => {
          if (err) return reject(err);
          return resolve(result as ITransactionDetails);
        },
      );
    });
  }

  /**
   * Transfers MAS from the sender to a recipient.
   *
   * @param amount - Amount of MAS to transfer (in smallest unit).
   * @param recipientAddress - Recipient's address.
   * @param fee - Transaction execution fee (in smallest unit).
   *
   * @returns A promise resolving to an  ITransactionDetails containing the network operation ID.
   */
  public async sendTransaction(
    amount: bigint,
    recipientAddress: string,
    fee: bigint,
  ): Promise<ITransactionDetails> {
    return new Promise<ITransactionDetails>((resolve, reject) => {
      connector.sendMessageToContentScript(
        this._providerName,
        AvailableCommands.AccountSendTransaction,
        {
          amount: amount.toString(),
          recipientAddress,
          fee: fee.toString(),
        },
        (result, err) => {
          if (err) return reject(err);
          return resolve(result as ITransactionDetails);
        },
      );
    });
  }

  /**
   * Interacts with a smart contract on the MASSA blockchain.
   *
   * @remarks
   * If dryRun is true, performs a dry run and returns an  IContractReadOperationResponse with dry run details.
   *
   * @param contractAddress - Smart contract address.
   * @param functionName - Function name to call.
   * @param parameter - Function parameters.
   * @param amount - Amount of MASSA coins to send (in smallest unit).
   * @param fee - Transaction execution fee (in smallest unit).
   * @param maxGas - Maximum gas for transaction execution.
   * @param nonPersistentExecution - Whether to perform a dry run.
   *
   * @returns A promise resolving to either:
   *  IContractReadOperationResponse (for dry runs) or ITransactionDetails (for actual transactions).
   */
  public async callSC(
    contractAddress: string,
    functionName: string,
    parameter: Uint8Array | Args,
    amount: bigint,
    fee: bigint,
    maxGas: bigint,
    nonPersistentExecution = false,
  ): Promise<ITransactionDetails | IContractReadOperationResponse> {
    return new Promise((resolve, reject) => {
      connector.sendMessageToContentScript(
        this._providerName,
        AvailableCommands.AccountCallSC,
        {
          nickname: this._name,
          name: functionName,
          at: contractAddress,
          args: parameter,
          coins: amount,
          fee: fee,
          maxGas: maxGas,
          nonPersistentExecution: nonPersistentExecution,
        },
        (result, err) => {
          if (err) return reject(err);
          return resolve(
            nonPersistentExecution
              ? (result as IContractReadOperationResponse)
              : (result as ITransactionDetails),
          );
        },
      );
    });
  }
}
