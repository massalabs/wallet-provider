/**
 * This interface defines specific data that are used to perform a dry run.
 *
 * @see dryRun - Wether or not to perform a dry run
 * @see maxGas - The maximum amount of gas to be used in the dry run
 */
export interface NonPersistentExecution {
  isNPE: boolean;
  maxGas?: bigint;
}
