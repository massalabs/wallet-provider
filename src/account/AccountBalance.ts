/**
 * Request for an AccountBalance command.
 */
export interface IAccountBalanceRequest {
  /** Account address */
  address: string;
}

/**
 * Response from an AccountBalance command.
 */
export interface IAccountBalanceResponse {
  /** Final confirmed balance of the account */
  finalBalance: string;
  /** Pending balance of the account */
  candidateBalance: string;
}
