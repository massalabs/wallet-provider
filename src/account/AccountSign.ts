/**
 * This interface represents the request object for the signing operation sent to the content script.
 */
export interface IAccountSignRequest {
  address: string;
  data: Uint8Array;
}

/**
 * This interface represents the response object containing the signed message data, which is sent by the content script 
 * after the signing operation.
 */
export interface IAccountSignResponse {
  pubKey: string;
  signature: Uint8Array;
}
