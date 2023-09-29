import { Args } from '@massalabs/web3-utils';

/**
 * Interface for requests to interact with deployed smart contracts via content script.
 *
 * @remarks
 * Pass an empty array if the smart contract function doesn't require parameters.
 *
 * nickname - Account nickname to use.
 * name - Name of the function to call.
 * at - Address of the deployed smart contract.
 * args - Parameters to pass to the function, represented as an `Args` object.
 * coins - Amount of MASSA coins sent to the block creator.
 * fee - Transaction fee.
 * nonPersistentExecution - Flag for non-persistent execution.
 */
export interface IAccountCallSCRequest {
  nickname: string;
  name: string;
  at: string;
  args: Args;
  coins: bigint;
  fee: bigint;
  nonPersistentExecution: boolean;
}
