export interface IAccountSignRequest {
  address: string;
  data: Uint8Array;
}

export interface IAccountSignResponse {
  pubKey: string;
  signature: Uint8Array;
}
