/**
 * This interface represents the request object for roll operations (buy & sell) sent to the content script.
 */
export interface IAccountSendTransactionRequest {
  recipientAddress: string;
  amount: string;
  fee: string;
}
