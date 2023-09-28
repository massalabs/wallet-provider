/**
 * Represents the payload for a signing operation request sent to the content script.
 * address - Account's unique address.
 * data - Data to be signed, as a Uint8Array.
 */
export interface IAccountSignRequest {
  address: string;
  data: Uint8Array;
}

/**
 * Represents response from the content script after a signing operation.
 * publicKey - Public key of the account.
 * signature - Signed message data.
 */
export interface IAccountSignResponse {
  publicKey: string;
  signature: string;
}

/**
 * Represents the output produced by the sign() method.
 * publicKey - Public key of the account.
 * base58Encoded - Base58 encoded representation of the signed data.
 */
export interface IAccountSignOutput {
  publicKey: string;
  base58Encoded: string;
}
