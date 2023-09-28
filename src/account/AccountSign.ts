/**
 * Represents the payload for a signing operation request sent to the content script.
 * @property address - Account's unique address.
 * @property data - Data to be signed, as a Uint8Array.
 */
export interface IAccountSignRequest {
  address: string;
  data: Uint8Array;
}

/**
 * Represents response from the content script after a signing operation.
 * @property publicKey - Public key of the account.
 * @property signature - Signed message data.
 */
export interface IAccountSignResponse {
  publicKey: string;
  signature: string;
}

/**
 * Represents the output produced by the sign() method.
 * @property publicKey - Public key of the account.
 * @property base58Encoded - Base58 encoded representation of the signed data.
 */
export interface IAccountSignOutput {
  publicKey: string;
  base58Encoded: string;
}
