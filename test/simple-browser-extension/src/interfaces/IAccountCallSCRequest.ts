/**
 * This interface represents the request object to send to the content script to 
 * interact with a deployed smart contract.
 */
export interface IAccountCallSCRequest {
    contractAddress: string,
    functionName: string,
    parameter: string,
    fee: bigint,
    }
    