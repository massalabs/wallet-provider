/**
 * Represents the request for an AccountBalance command.
 *
 * address - The account address.
 */
export interface IAccountBalanceRequest {
  address: string;
}

/**
 * Represents the response from an AccountBalance command.
 *
 * finalBalance - The account's final confirmed balance.
 * candidateBalance - The account's pending balance.
 */
export interface IAccountBalanceResponse {
  finalBalance: string;
  candidateBalance: string;
}
