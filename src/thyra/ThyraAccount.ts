import {
  IAccountBalanceResponse,
  IAccountDetails,
  IAccountSignResponse,
  ITransactionDetails,
} from '..';
import { IAccount } from '../account/IAccount';
import { JsonRpcResponseData, getRequest, postRequest } from './RequestHandler';
import { THYRA_ACCOUNTS_URL } from './ThyraProvider';

/**
 * The Thyra's account balance url
 */
const THYRA_BALANCE_URL = `https://my.massa/massa/addresses?attributes=balance&addresses`;

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
      balance: balance.final,
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
        `${THYRA_ACCOUNTS_URL}/${this._name}/signOperation`,
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
   * @param fee - The fee to be paid for the transaction.
   * @returns An ITransactionDetails object. It contains the operationId on the network.
   */
  buyRolls(amount: string, fee: string): Promise<ITransactionDetails> {
    throw new Error('Method not implemented.');
  }

  /**
   * This method aims to sell rolls on behalf of the sender.
   *
   * @param amount - The amount of rolls to be sold.
   * @param fee - The fee to be paid for the transaction.
   * @returns An ITransactionDetails object. It contains the operationId on the network.
   */
  sellRolls(amount: string, fee: string): Promise<ITransactionDetails> {
    throw new Error('Method not implemented.');
  }

  /**
   * This method aims to transfer MAS on behalf of the sender to a recipient.
   *
   * @param amount - The amount of MAS to be transferred.
   * @param fee - The fee to be paid for the transaction.
   * @returns An ITransactionDetails object. It contains the operationId on the network.
   */
  sendTransaction(
    amount: string,
    recipientAddress: string,
    fee: string,
  ): Promise<ITransactionDetails> {
    throw new Error('Method not implemented.');
  }
}
