/**
 * Payload for a signing operation request sent to the content script.
 */
export interface IAccountSignRequest {
  /** Account's unique address */
  address: string;
  /** Data to be signed, represented as a Uint8Array */
  data: Uint8Array;
}

/**
 * Response from the content script after a signing operation.
 */
export interface IAccountSignResponse {
  /** Public key of the account */
  publicKey: string;
  /** Signed message data */
  signature: string;
}

/**
 * Output produced by the sign() method.
 */
export interface IAccountSignOutput {
  /** Public key of the account */
  publicKey: string;
  /** Base58 encoded representation of the signed data */
  base58Encoded: string;
}
