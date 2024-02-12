/**
 * Interface for transaction send requests sent to the content script.
 */
export interface IAccountSendTransactionRequest {
  /** Address of the recipient */
  recipientAddress: string;
  /** Amount to be sent */
  amount: string;
  /** Transaction fee */
  fee: string;
}
