import {
  AvailableCommands,
  IAccountBalanceRequest,
  IAccountBalanceResponse,
  IAccountDetails,
  IAccountSignRequest,
  IAccountSignResponse,
} from '..';
import { IAccount } from '../account/IAccount';
import { JsonRpcResponseData, getRequest, postRequest } from './RequestHandler';
import { IThyraWallet, THYRA_ACCOUNTS_URL } from './ThyraProvider';

interface ISignOperation {
  operation: Uint8Array;
  batch?: boolean;
  correlationId?: string;
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
    // TODO
    return null;
  }

  public async sign(data: Uint8Array): Promise<IAccountSignResponse> {
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
