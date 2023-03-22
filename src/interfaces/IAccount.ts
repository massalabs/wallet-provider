import { ISignResult } from './ISignResult';

export interface IAccount {
  address(): Promise<string>;
  balance(): Promise<bigint>;
  sign(payload: Uint8Array): Promise<ISignResult>;
}
