import {
  IAccountBalanceRequest,
  IAccountBalanceResponse,
} from './AccountBalance';
import { IAccountSignRequest, IAccountSignResponse } from './AccountSign';
import { connector } from '../connector/Connector';
import { IAccount } from './IAccount';
import { AvailableCommands } from '..';

export class Account {
  private _providerName: string;
  private _address: string;
  private _name: string;

  public constructor({ address, name }: IAccount, providerName: string) {
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
    return new Promise<IAccountBalanceResponse>((resolve, reject) => {
      connector.sendMessageToContentScript(
        this._providerName,
        AvailableCommands.AccountBalance,
        { address: this._address } as IAccountBalanceRequest,
        (err, result) => {
          if (err) return reject(err);
          return resolve(result);
        },
      );
    });
  }

  public async sign(data: Uint8Array): Promise<IAccountSignResponse> {
    return new Promise<IAccountSignResponse>((resolve, reject) => {
      connector.sendMessageToContentScript(
        this._providerName,
        AvailableCommands.AccountSign,
        { address: this._address, data } as IAccountSignRequest,
        (err, result) => {
          if (err) return reject(err);
          return resolve(result);
        },
      );
    });
  }
}
