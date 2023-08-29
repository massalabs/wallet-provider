/**
 * Represents the information related to a smart contract.
 *
 * @remarks
 * This interface is used to track the smart contract information, including the
 * storage fee, maximum gas (that the execution of the contract is allowed to cost),
 * contract data (as text or bytecode), contract address,
 * and an optional datastore for the smart contract's operational storage data.
 *
 * @see fee of type `bigint` represents the storage fee for the smart contract.
 * @see maxGas of type `bigint` represents the maximum gas that can be consumed by the smart contract.
 * @see maxCoins of type `bigint` represents maximum amount of coins allowed to be spent by the execution
 * @see contractDataBinary of type `Uint8Array` represents the contract's data as bytecode.
 * @see expiry of type `bigint` represents the expiry time of the smart contract.
 * @see gasPrice of type `bigint` represents the gas price the sender is willing to pay of the smart contract.
 * @see datastore of type `Map<Uint8Array, Uint8Array> | undefined` represents the contract's storage data (optional).
 */
export interface IContractData {
  fee: bigint;
  maxGas: bigint;
  maxCoins: bigint;
  expiry: bigint;
  gasPrice: bigint;
  contractDataBinary: Uint8Array;
  datastore?: Map<Uint8Array, Uint8Array>;
}
