import {
  IAccountBalanceResponse,
  IAccountDetails,
  IAccountSignResponse,
} from '..';
import { IAccount } from '../account/IAccount';
import { JsonRpcResponseData, getRequest, postRequest } from './RequestHandler';
import { THYRA_ACCOUNTS_URL } from './ThyraProvider';

const THYRA_BALANCE_URL = `https://my.massa/massa/addresses?attributes=balance&addresses`;

interface ISignOperation {
  operation: string;
  batch?: boolean;
  correlationId?: string;
}

interface IBalance {
  final: string;
  pending: string;
}

interface IAddressesBalances {
  addressesAttributes: {
    [key: string]: { balance: IBalance };
  };
}

export class ThyraAccount implements IAccount {
  private _providerName: string;
  private _address: string;
  private _name: string;

  public constructor({ address, name }: IAccountDetails, providerName: string) {
    this._address = address;
    this._name = name;
    this._providerName = providerName;
  }

  public address(): string {
    return this._address;
  }

  public name(): string {
    return this._name;
  }

  public providerName(): string {
    return this._providerName;
  }

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
      throw signOpResponse.error.message;
    }
    const balance: IBalance =
      signOpResponse.result.addressesAttributes[this._address].balance;
    return {
      balance: balance.final,
    };
  }

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
      throw signOpResponse.error.message;
    }
    return signOpResponse.result;
  }
}
