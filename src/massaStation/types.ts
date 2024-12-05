import { NetworkName } from '@massalabs/massa-web3';

export type ExecuteFunctionBody = {
  nickname: string;
  name: string;
  at: string;
  args?: string;
  fee?: string;
  maxGas?: string;
  coins?: number; // number type keeped for backward compatibility
  async?: boolean;
};

export type DeploySCFunctionBody = {
  nickname: string;
  smartContract: string;
  maxCoins: string;
  coins: string;
  parameters: string;
  fee: string;
  description: string;
};

export type PluginInfo = {
  author: string;
  description: string;
  home: string;
  name: string;
  status: string;
  version: string;
};

export type PluginManagerBody = PluginInfo[];

export type MSNetworksResp = {
  chainId: number | string;
  network: NetworkName;
  url: string;
};

export enum MassaStationAccountStatus {
  OK = 'ok',
  CORRUPTED = 'corrupted',
}

export type MSAccountsResp = MSAccount[];

/**
 * This interface represents the payload returned by making a call to MassaStation's accounts url.
 */
export type MSAccount = {
  address: string;
  nickname: string;
  keyPair: {
    nonce: string;
    privateKey: string;
    publicKey: string;
    salt: string;
  };
  status: MassaStationAccountStatus;
};

/**
 * This interface represents the payload returned by making a call to MassaStation's get balances url.
 */
export type MSBalancesResp = {
  addressesAttributes: {
    [key: string]: {
      balance: {
        pending: string;
        final: string;
      };
    };
  };
};

/**
 * Payload for a sign message request.
 */
export type MSAccountSignPayload = {
  description: string;
  message: string;
  DisplayData: boolean;
};

/**
 * Response from the content script after a signing operation.
 */
export type MSAccountSignResp = {
  /** Public key of the account */
  publicKey: string;
  /** Signed message data */
  signature: string;
};

export type MSSendOperationResp = {
  operationId: string;
};
