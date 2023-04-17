/**
 * This interface represents the request object sent to the content script
 * for deleting an account.
 */
export interface IAccountDeletionRequest {
  address: string;
}

/**
 * This interface represents the response object that is sent by the content script to confirm
 * or not the deletion of an account.
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
