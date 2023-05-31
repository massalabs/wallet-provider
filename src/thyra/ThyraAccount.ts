import {
  IAccountBalanceResponse,
  IAccountDetails,
  IAccountSignResponse,
  ITransactionDetails,
} from '..';
import { IAccount } from '../account/IAccount';
import { JsonRpcResponseData, getRequest, postRequest } from './RequestHandler';
import { THYRA_URL, THYRA_ACCOUNTS_URL } from './ThyraProvider';
import { Args } from '@massalabs/massa-web3';
import { argsToBase64 } from '../utils/argsToBase64';

/**
 * The Thyra's account balance url
 */
const THYRA_BALANCE_URL = `${THYRA_URL}massa/addresses?attributes=balance&addresses`;

/**
 * This interface represents the payload returned by making a call to Thyra's sign operation `/signOperation` url.
 */
interface ISignOperation {
  operation: string;
  batch?: boolean;
  correlationId?: string;
}

/**
 * This interface represents the the individual wallet's final and pending balances returned by Thyra
 */
interface IBalance {
  final: string;
  pending: string;
}

/**
 * This interface represents the payload returned by making a call to Thyra's get balances url.
 */
interface IAddressesBalances {
  addressesAttributes: {
    [key: string]: { balance: IBalance };
  };
}

/**
 * This module contains the ThyraAccount class. It is responsible for representing an account in the Thyra wallet.
 *
 * @remarks
 * This class provides methods to interact with Thyra account's {@link balance} and to {@link sign} messages.
 *
 */
export class ThyraAccount implements IAccount {
  private _providerName: string;
  private _address: string;
  private _name: string;

  /**
   * This constructor takes an object of type IAccountDetails and a providerName string as its arguments.
   *
   * @param address - The address of the account.
   * @param name - The name of the account.
   * @param providerName - The name of the provider.
   * @returns An instance of the Account class.
   *
   * @remarks
   * - The Account constructor takes an object of type IAccountDetails and a providerName string as its arguments.
   * - The IAccountDetails object contains the account's address and name.
   * - The providerName string identifies the provider that is used to interact with the blockchain.
   */
  public constructor({ address, name }: IAccountDetails, providerName: string) {
    this._address = address;
    this._name = name;
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
   * This method aims to retrieve the account's balance.
   *
   * @returns A promise that resolves to an object of type IAccountBalanceResponse. It contains the account's balance.
   */
  public async balance(): Promise<IAccountBalanceResponse> {
    let signOpResponse: JsonRpcResponseData<IAddressesBalances> = null;
    try {
      signOpResponse = await getRequest<IAddressesBalances>(
        `${THYRA_BALANCE_URL}=${this._address}`,
      );
    } catch (ex) {
      console.error(`Thyra account balance error`);
      throw ex;
    }
    if (signOpResponse.isError || signOpResponse.error) {
      throw signOpResponse.error;
    }
    const balance: IBalance =
      signOpResponse.result.addressesAttributes[this._address].balance;
    return {
      finalBalance: balance.final,
      candidateBalance: balance.pending,
    };
  }

  /**
   * This method aims to sign a message.
   *
   * @param data - The message to be signed.
   * @returns An IAccountSignResponse object. It contains the signature of the message.
   */
  public async sign(data: Uint8Array | string): Promise<IAccountSignResponse> {
    let signOpResponse: JsonRpcResponseData<IAccountSignResponse> = null;
    try {
      signOpResponse = await postRequest<IAccountSignResponse>(
        `${THYRA_ACCOUNTS_URL}/${this._name}/sign`,
        {
          operation: data,
          batch: false,
        } as ISignOperation,
      );
    } catch (ex) {
      console.error(`Thyra account signing error`);
      throw ex;
    }
    if (signOpResponse.isError || signOpResponse.error) {
      throw signOpResponse.error;
    }
    return signOpResponse.result;
  }

  /**
   * This method aims to buy rolls on behalf of the sender.
   *
   * @param amount - The amount of rolls to be bought.
   * @param fee - The fee to be paid for the transaction execution by the node.
   * @returns An ITransactionDetails object. It contains the operationId on the network.
   */
  public async buyRolls(
    amount: bigint,
    fee: bigint,
  ): Promise<ITransactionDetails> {
    let buyRollsOpResponse: JsonRpcResponseData<ITransactionDetails> = null;
    const url = `${THYRA_ACCOUNTS_URL}/${this._name}/rolls`;
    const body = {
      fee: fee.toString(),
      amount: amount.toString(),
      side: 'buy',
    };
    try {
      buyRollsOpResponse = await postRequest<ITransactionDetails>(url, body);
    } catch (ex) {
      console.error(`Thyra account: error while buying rolls: ${ex}`);
      throw ex;
    }
    if (buyRollsOpResponse.isError || buyRollsOpResponse.error) {
      throw buyRollsOpResponse.error;
    }
    return buyRollsOpResponse.result;
  }

  /**
   * This method aims to sell rolls on behalf of the sender.
   *
   * @param amount - The amount of rolls to be sold.
   * @param fee - The fee to be paid for the transaction execution by the node.
   * @returns An ITransactionDetails object. It contains the operationId on the network.
   */
  public async sellRolls(
    amount: bigint,
    fee: bigint,
  ): Promise<ITransactionDetails> {
    let sellRollsOpResponse: JsonRpcResponseData<ITransactionDetails> = null;
    const url = `${THYRA_ACCOUNTS_URL}/${this._name}/rolls`;
    const body = {
      fee: fee.toString(),
      amount: amount.toString(),
      side: 'sell',
    };
    try {
      sellRollsOpResponse = await postRequest<ITransactionDetails>(url, body);
    } catch (ex) {
      console.error(`Thyra account: error while selling rolls: ${ex}`);
      throw ex;
    }
    if (sellRollsOpResponse.isError || sellRollsOpResponse.error) {
      throw sellRollsOpResponse.error;
    }
    return sellRollsOpResponse.result;
  }

  /**
   * This method aims to transfer MAS on behalf of the sender to a recipient.
   *
   * @param amount - The amount of MAS to be transferred.
   * @param fee - The fee to be paid for the transaction execution by the node.
   * @returns An ITransactionDetails object. It contains the operationId on the network.
   */
  sendTransaction(
    amount: bigint,
    recipientAddress: string,
    fee: bigint,
  ): Promise<ITransactionDetails> {
    throw new Error('Method not implemented.');
  }

  /**
   * This method aims to interact with a smart contract deployed on the MASSA blockchain.
   *
   * @param contractAddress - The address of the smart contract.
   * @param functionName - The name of the function to be called.
   * @param parameter - The parameters as an Args object to be passed to the function.
   * @param amount - The amount of MASSA coins to be sent to the block creator.
   *
   * @returns An ITransactionDetails object.
   * - It contains the first event emitted by the contract.
   * - If the contract does not emit any event, it contains "Function called successfully but no event generated"
   */
  public async callSC(
    contractAddress: string,
    functionName: string,
    parameter: Args,
    amount: number,
  ): Promise<ITransactionDetails> {
    // convert parameter to base64
    const args = argsToBase64(parameter);
    let CallSCOpResponse: JsonRpcResponseData<ITransactionDetails> = null;
    const url = `${THYRA_URL}cmd/executeFunction`;
    const body = {
      nickname: this._name,
      name: functionName,
      at: contractAddress,
      args: args,
      coins: amount,
    };
    try {
      CallSCOpResponse = await postRequest<ITransactionDetails>(url, body);
    } catch (ex) {
      console.log(
        `Thyra account: error while interacting with smart contract: ${ex}`,
      );
      throw ex;
    }
    if (CallSCOpResponse.isError || CallSCOpResponse.error) {
      throw CallSCOpResponse.error;
    }
    return CallSCOpResponse.result;
  }
}
