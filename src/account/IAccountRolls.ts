/**
 * Interface for roll operation requests (buy & sell) sent to the content script.
 */
export interface IAccountRollsRequest {
  /** Amount of rolls involved in the operation */
  amount: string;
  /** Fee associated with the operation */
  fee: string;
}
