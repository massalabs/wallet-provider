import { Args } from "@massalabs/massa-web3";

/**
 * This interface represents the request object to send to the content script to 
 * interact with a deployed smart contract.
 */
export interface IAccountCallSCRequest {
    nickname: string, // account nickname
    name: string, // function name
    at: string, // contract address
    args: Args, // function arguments
    coins: number, // coins to send to the block creator
    }
    