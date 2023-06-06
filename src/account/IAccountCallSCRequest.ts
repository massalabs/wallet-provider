import { Args } from '@massalabs/massa-web3';
import { IDryRunData } from './IDryRunData';

/**
 * This interface represents the request object to send to the content script to
 * interact with a deployed smart contract.
 *
 * @remarks
 * - If your smart contract function does not require any parameters, you can pass an empty array.
 *
 * @see nickname - The nickname of the account to use.
 * @see name - The name of the function to be called.
 * @see at - The address of the smart contract.
 * @see args - The parameters as an Args object to be passed to the function.
 * @see coins - The amount of MASSA coins to be sent to the block creator.
 * @see dryRun - The parameters for the dry run.
 */
export interface IAccountCallSCRequest {
  nickname: string;
  name: string;
  at: string;
  args: Args;
  coins: bigint;
  dryRun: IDryRunData;
}
