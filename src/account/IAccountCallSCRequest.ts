import { Args } from '@massalabs/web3-utils';

/**
 * Interface for requests to interact with deployed smart contracts via content script.
 *
 * @remarks
 * Pass an empty array if the smart contract function doesn't require parameters.
 */
export interface IAccountCallSCRequest {
  /** Account nickname to use */
  nickname: string;
  /** Function name to call */
  name: string;
  /** Deployed smart contract address */
  at: string;
  /** Parameters to pass to the function, as an `Args` object */
  args: Args;
  /** Amount of MASSA coins sent to the block creator */
  coins: bigint;
  /** Transaction fee */
  fee: bigint;
  /** Flag for non-persistent execution */
  nonPersistentExecution: boolean;
}
