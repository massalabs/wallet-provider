/**
 * This interface represents the request object that is sent to the content script.
 */
export interface IAccountImportRequest {
  privateKey: string;
  publicKey: string;
}

/**
 * This interface represents the response object that is sent by the content script.
 */
export interface IAccountImportResponse {
  response: EAccountImportResponse;
  message: string;
}

/**
 * This enum represents the possible responses that can be sent by the content script.
 */
export enum EAccountImportResponse {
  OK,
  REFUSED,
  ERROR,
}
