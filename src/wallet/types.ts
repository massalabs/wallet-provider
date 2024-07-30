/**
 * This interface represents the response object sent by the content script,
 * indicating the result of an account import request.
 */
export type IAccountImportResponse = {
  response: Status;
  message: string;
};

/**
 * This enum represents the possible responses from the content script
 * in response to an account import request.
 */
export enum Status {
  OK,
  REFUSED,
  ERROR,
}

/**
 * This interface represents the request object sent to the content script
 * for deleting an account.
 */
export interface IAccountDeletionRequest {
  address: string;
}

/**
 * This interface represents the response object sent by the content script,
 * indicating the result of an account deletion request.
 */
export interface IAccountDeletionResponse {
  response: Status;
}

/**
 * This interface represents the request object sent to the content script
 * for generation a new random account.
 */
export interface IAccountGenerationRequest {
  name: string;
}
