/**
 * This interface represents the request object that is sent to the content script.
 */
export interface IAccountImportRequest {
  privateKey: string;
  publicKey: string;
}

/**
 * This interface represents the response object sent by the content script,
 * indicating the result of an account import request. 
 */
export interface IAccountImportResponse {
  response: EAccountImportResponse;
  message: string;
}

/**
 * This enum represents the possible responses from the content script
 * in response to an account import request. 
 */
export enum EAccountImportResponse {
  OK,
  REFUSED,
  ERROR,
}
