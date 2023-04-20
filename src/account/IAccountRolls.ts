/**
 * This interface represents the request object for roll operations (buy & sell) sent to the content script.
 */
export interface IAccountRollsRequest {
  amount: string;
  fee: string;
}
