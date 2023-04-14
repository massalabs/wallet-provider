/**
 * This interface represents the signing request we are sending to the content script.
 */
export interface IAccountSignRequest {
  address: string;
  data: Uint8Array;
}

/**
 * This interface represents the response object of the previously sent message which is now signed.
 * It is sent by the content script.
 */
export interface IAccountSignResponse {
  pubKey: string;
  signature: Uint8Array;
}
