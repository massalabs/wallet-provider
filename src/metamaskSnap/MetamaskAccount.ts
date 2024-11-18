import { MetaMaskInpageProvider } from '@metamask/providers';
import {
  Address,
  CallSCParams,
  DatastoreEntry,
  DeploySCParams,
  EventFilter,
  formatNodeStatusObject,
  MAX_GAS_CALL,
  Network,
  NodeStatusInfo,
  Operation,
  OperationOptions,
  OperationStatus,
  Provider,
  ReadSCData,
  ReadSCParams,
  SCEvent,
  SignedData,
  SmartContract,
  strToBytes,
} from '@massalabs/massa-web3';
import { WalletName } from '../wallet';
import { errorHandler } from '../errors/utils/errorHandler';
import { operationType } from '../utils/constants';
import { getClient, networkInfos } from '../massaStation/utils/network';
import {
  buyRolls,
  callSC,
  getBalance,
  readSC,
  sellRolls,
  signMessage,
  transfer,
} from './services';
import { getMinimalFees } from './services/getMinimalFees';

export class MetamaskAccount implements Provider {
  constructor(
    public readonly address: string,
    private readonly provider: MetaMaskInpageProvider,
  ) {}

  get accountName(): string {
    return this.address;
  }

  get providerName(): string {
    return WalletName.Metamask;
  }

  async balance(final = false): Promise<bigint> {
    const { finalBalance, candidateBalance } = await getBalance(this.provider, {
      address: this.address,
    });
    return BigInt(final ? finalBalance : candidateBalance);
  }

  async networkInfos(): Promise<Network> {
    return networkInfos();
  }

  async sign(data: Buffer | Uint8Array | string): Promise<SignedData> {
    try {
      const dataArray =
        typeof data === 'string'
          ? Array.from(strToBytes(data))
          : Array.from(data);

      const { publicKey, signature } = await signMessage(this.provider, {
        data: dataArray,
      });

      return {
        publicKey,
        signature: signature.toString(),
      };
    } catch (error) {
      throw errorHandler(operationType.Sign, error);
    }
  }

  private async handleRollOperation(
    operation: 'buy' | 'sell',
    amount: bigint,
    opts?: OperationOptions,
  ): Promise<Operation> {
    try {
      const fee = opts?.fee ?? (await getMinimalFees(this.provider));
      const params = {
        amount: amount.toString(),
        fee: fee.toString(),
      };

      const { operationId } = await (operation === 'buy'
        ? buyRolls(this.provider, params)
        : sellRolls(this.provider, params));

      return new Operation(this, operationId);
    } catch (error) {
      throw errorHandler(
        operation === 'buy' ? operationType.BuyRolls : operationType.SellRolls,
        error,
      );
    }
  }

  async buyRolls(amount: bigint, opts?: OperationOptions): Promise<Operation> {
    return this.handleRollOperation('buy', amount, opts);
  }

  async sellRolls(amount: bigint, opts?: OperationOptions): Promise<Operation> {
    return this.handleRollOperation('sell', amount, opts);
  }

  async transfer(
    to: Address | string,
    amount: bigint,
    opts?: OperationOptions,
  ): Promise<Operation> {
    try {
      const fee = opts?.fee ?? (await getMinimalFees(this.provider));
      const { operationId } = await transfer(this.provider, {
        amount: amount.toString(),
        fee: fee.toString(),
        recipientAddress: to.toString(),
      });

      return new Operation(this, operationId);
    } catch (error) {
      throw errorHandler(operationType.SendTransaction, error);
    }
  }

  async callSC(params: CallSCParams): Promise<Operation> {
    try {
      const args = params.parameter ?? new Uint8Array();
      const unsafeParameters =
        args instanceof Uint8Array ? args : Uint8Array.from(args.serialize());

      const fee = params.fee ?? (await getMinimalFees(this.provider));
      const { operationId } = await callSC(this.provider, {
        functionName: params.func,
        at: params.target,
        args: Array.from(unsafeParameters),
        coins: (params.coins ?? 0n).toString(),
        fee: fee.toString(),
        maxGas: (params.maxGas ?? MAX_GAS_CALL).toString(),
      });

      return new Operation(this, operationId);
    } catch (error) {
      throw errorHandler(operationType.CallSC, error);
    }
  }

  async readSC(params: ReadSCParams): Promise<ReadSCData> {
    if (params.maxGas > MAX_GAS_CALL) {
      throw new Error(
        `Gas amount ${params.maxGas} exceeds the maximum allowed ${MAX_GAS_CALL}`,
      );
    }

    try {
      const args = params.parameter ?? new Uint8Array();
      const unsafeParameters =
        args instanceof Uint8Array ? args : Uint8Array.from(args.serialize());

      const fee = params.fee ?? (await getMinimalFees(this.provider));
      const res = await readSC(this.provider, {
        fee: fee.toString(),
        functionName: params.func,
        at: params.target,
        args: Array.from(unsafeParameters),
        coins: (params.coins ?? 0n).toString(),
        maxGas: (params.maxGas ?? MAX_GAS_CALL).toString(),
        caller: params.caller ?? this.address,
      });

      return {
        value: new Uint8Array(res.data),
        info: {
          gasCost: res.infos.gasCost,
          events: [],
          error: '',
        },
      };
    } catch (error) {
      throw new Error(`Smart contract read failed: ${error.message}`);
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async deploySC(_params: DeploySCParams): Promise<SmartContract> {
    throw new Error(
      'Smart contract deployment not yet implemented in MetaMask snap',
    );
  }

  async getOperationStatus(opId: string): Promise<OperationStatus> {
    const client = await getClient();
    return client.getOperationStatus(opId);
  }

  async getEvents(filter: EventFilter): Promise<SCEvent[]> {
    const client = await getClient();
    return client.getEvents(filter);
  }

  async getNodeStatus(): Promise<NodeStatusInfo> {
    const client = await getClient();
    const status = await client.status();
    return formatNodeStatusObject(status);
  }

  async getStorageKeys(
    address: string,
    filter: Uint8Array | string = new Uint8Array(),
    final = true,
  ): Promise<Uint8Array[]> {
    const client = await getClient();
    const filterBytes =
      typeof filter === 'string' ? strToBytes(filter) : filter;
    return client.getDataStoreKeys(address, filterBytes, final);
  }

  async readStorage(
    address: string,
    keys: Uint8Array[] | string[],
    final = true,
  ): Promise<Uint8Array[]> {
    const client = await getClient();
    const entries: DatastoreEntry[] = keys.map((key) => ({
      key,
      address,
    }));
    return client.getDatastoreEntries(entries, final);
  }
}
