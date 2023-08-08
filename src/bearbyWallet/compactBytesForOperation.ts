import { OperationTypeId } from './BearbyAccount';
import { ICallData } from './ICallData';
import { IContractData } from './IcontractData';
import { base58Decode, varintEncode } from './Xbqcrypto';

export type DataType =
  | IContractData
  | ITransactionData
  | IRollsData
  | ICallData;

/**
 * Interface for transaction data
 *
 * @see fee - fee paid for transaction
 * @see amount - amount of tokens sent
 * @see recipientAddress - recipient address
 */
export interface ITransactionData {
  fee: bigint;
  amount: bigint;
  recipientAddress: string;
}

/**
 * Represents the data of a roll.
 *
 * @see fee - fees paid for the roll
 * @see amount - amount of rolls
 */
export interface IRollsData {
  fee: bigint;
  amount: bigint;
}

/**
 * Compacts bytes payload per operation.
 *
 * @param data - The operation data.
 * @param opTypeId - The operation type id.
 * @param account - The account used.
 * @param expirePeriod - The expire period.
 *
 * @returns The compacted bytes payload.
 */
export function compactBytesForOperation(
  data: DataType,
  opTypeId: OperationTypeId,
  expirePeriod: number,
): Buffer {
  const feeEncoded = Buffer.from(varintEncode(data.fee));
  const expirePeriodEncoded = Buffer.from(varintEncode(expirePeriod));
  const typeIdEncoded = Buffer.from(varintEncode(opTypeId.valueOf()));

  // max gas
  const maxGasEncoded = Buffer.from(varintEncode((data as ICallData).maxGas));

  // coins to send
  const coinsEncoded = Buffer.from(varintEncode((data as ICallData).coins));
  // target address
  const targetAddressEncoded = encodeAddressToBytes(
    (data as ICallData).targetAddress,
    true,
  );
  // target function name and name length
  const functionNameEncoded = new Uint8Array(
    Buffer.from((data as ICallData).functionName, 'utf8'),
  );
  const functionNameLengthEncoded = Buffer.from(
    varintEncode(functionNameEncoded.length),
  );
  // parameter
  const parametersEncoded = new Uint8Array((data as ICallData).parameter);
  const parametersLengthEncoded = Buffer.from(
    varintEncode(parametersEncoded.length),
  );
  return Buffer.concat([
    feeEncoded,
    expirePeriodEncoded,
    typeIdEncoded,
    maxGasEncoded,
    coinsEncoded,
    targetAddressEncoded,
    functionNameLengthEncoded,
    functionNameEncoded,
    parametersLengthEncoded,
    parametersEncoded,
  ]);
}

// encode a string address to bytes.
const encodeAddressToBytes = (
  address: string,
  isSmartContract = false,
): Buffer => {
  let targetAddressEncoded = base58Decode(address.slice(2));
  targetAddressEncoded = Buffer.concat([
    isSmartContract ? Buffer.from([1]) : Buffer.from([0]),
    targetAddressEncoded,
  ]);

  return targetAddressEncoded;
};
