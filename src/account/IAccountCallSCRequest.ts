/**
 * This interface represents the request object to send to the content script to
 * interact with a deployed smart contract.
 *
 * @remarks
 * - If your smart contract function does not require any parameters, you can pass an empty array.
 * - If your smart contract function parameters contain a number or bigNumber, you must pass it as a string.
 */
export interface IAccountCallSCRequest {
  contractAddress: string;
  functionName: string;
  parameter: string;
  amount: bigint;
  expiry: bigint;
  fee: bigint;
}
