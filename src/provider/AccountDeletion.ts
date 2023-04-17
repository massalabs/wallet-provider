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
  response: EAccountDeletionResponse;
}

/**
 * This enum represents the possible responses that can be sent by the content script
 * when we ask for an account deletion.
 */
export enum EAccountDeletionResponse {
  OK,
  REFUSED,
  ERROR,
}
