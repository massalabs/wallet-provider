/**
 * This interface represents the request object to send to the content script to
 * interact with a deployed smart contract.
 */
export interface IAccountInteractWithSCRequest {
  contractAddress: string;
  functionName: string;
  parameter: (string | bigint | boolean)[];
  fee: bigint;
}
