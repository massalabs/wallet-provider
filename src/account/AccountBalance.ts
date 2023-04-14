/**
 * This interface represents the request object of the AccountBalance command.
 */
export interface IAccountBalanceRequest {
  address: string;
}

/**
 * This interface represents the response object of the AccountBalance command sent by the content script.
 */
export interface IAccountBalanceResponse {
  balance: string;
}
