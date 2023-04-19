export interface IAccountSignRequest {
  address: string;
  data: Uint8Array | string;
}

export interface IAccountSignResponse {
  publicKey: string;
  signature: Uint8Array;
}
