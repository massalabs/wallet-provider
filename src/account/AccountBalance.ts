/**
 * Represents the request for an AccountBalance command.
 *
 * @property address - The account address.
 */
export interface IAccountBalanceRequest {
  address: string;
}

/**
 * Represents the response from an AccountBalance command.
 *
 * @property finalBalance - The account's final confirmed balance.
 * @property candidateBalance - The account's pending balance.
 */
export interface IAccountBalanceResponse {
  finalBalance: string;
  candidateBalance: string;
}
