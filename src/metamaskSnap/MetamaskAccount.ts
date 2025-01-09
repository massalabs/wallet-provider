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
  SignedData,
  SmartContract,
  strToBytes,
  rpcTypes,
  Mas,
} from '@massalabs/massa-web3';
import { WalletName } from '../wallet';
import { errorHandler } from '../errors/utils/errorHandler';
import { operationType } from '../utils/constants';
import { getClient, networkInfos } from '../massaStation/utils/network';
import {
  buyRolls,
  callSC,
  deploySC,
  getBalance,
  sellRolls,
  signMessage,
  transfer,
} from './services';
import type {
  BuyRollsParams,
  SellRollsParams,
  TransferParams,
  CallSCParams as MMCallSCParams,
  DeploySCParams as MMDeploySCParams,
} from '@massalabs/metamask-snap';

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

  async balanceOf(
    addresses: string[],
    final = false,
  ): Promise<{ address: string; balance: bigint }[]> {
    const client = await getClient();
    const addressesInfo = await client.getMultipleAddressInfo(addresses);

    return addressesInfo.map((addressInfo) => ({
      address: addressInfo.address,
      balance: final
        ? Mas.fromString(addressInfo.final_balance)
        : Mas.fromString(addressInfo.candidate_balance),
    }));
  }

  async networkInfos(): Promise<Network> {
    return networkInfos();
  }

  async sign(inData: Uint8Array | string): Promise<SignedData> {
    try {
      const data = typeof inData === 'string' ? inData : Array.from(inData);
      const { publicKey, signature } = await signMessage(this.provider, {
        data,
      });

      return {
        publicKey,
        signature,
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
      const params: BuyRollsParams | SellRollsParams = {
        amount: amount.toString(),
      };
      if (opts?.fee) {
        params.fee = opts?.fee.toString();
      }

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
      const params: TransferParams = {
        amount: amount.toString(),
        recipientAddress: to.toString(),
      };
      if (opts?.fee) {
        params.fee = opts?.fee.toString();
      }
      const { operationId } = await transfer(this.provider, params);

      return new Operation(this, operationId);
    } catch (error) {
      throw errorHandler(operationType.SendTransaction, error);
    }
  }

  async callSC(params: CallSCParams): Promise<Operation> {
    try {
      const callSCparams: MMCallSCParams = {
        functionName: params.func,
        at: params.target,
      };
      if (params.parameter) {
        callSCparams.args =
          params.parameter instanceof Uint8Array
            ? Array.from(params.parameter)
            : Array.from(params.parameter.serialize());
      }
      if (params.coins) {
        callSCparams.coins = params.coins.toString();
      }
      if (params.maxGas) {
        callSCparams.maxGas = params.maxGas.toString();
      }
      if (params.fee) {
        callSCparams.fee = params.fee.toString();
      }

      const { operationId } = await callSC(this.provider, callSCparams);

      return new Operation(this, operationId);
    } catch (error) {
      throw errorHandler(operationType.CallSC, error);
    }
  }

  async readSC(params: ReadSCParams): Promise<ReadSCData> {
    if (params?.maxGas > MAX_GAS_CALL) {
      throw new Error(
        `Gas amount ${params.maxGas} exceeds the maximum allowed ${MAX_GAS_CALL}`,
      );
    }
    try {
      const args = params.parameter ?? new Uint8Array();
      const parameter =
        args instanceof Uint8Array ? args : Uint8Array.from(args.serialize());

      const client = await getClient();
      const readOnlyParams = {
        ...params,
        caller: params.caller ?? this.address,
        parameter,
      };
      return client.executeReadOnlyCall(readOnlyParams);
    } catch (error) {
      throw new Error(`Smart contract read failed: ${error.message}`);
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async deploySC(params: DeploySCParams): Promise<SmartContract> {
    try {
      const deployParams: MMDeploySCParams = {
        bytecode: Array.from(params.byteCode),
      };
      if (params.parameter) {
        deployParams.args = Array.from(
          params.parameter instanceof Uint8Array
            ? params.parameter
            : params.parameter.serialize(),
        );
      }
      if (params.coins) {
        deployParams.coins = params.coins.toString();
      }
      if (params.maxGas) {
        deployParams.maxGas = params.maxGas.toString();
      }
      if (params.fee) {
        deployParams.fee = params.fee.toString();
      }
      if (params.maxCoins) {
        deployParams.maxCoins = params.maxCoins?.toString();
      }

      const { operationId } = await deploySC(this.provider, deployParams);
      const op = new Operation(this, operationId);
      const deployedAddress = await op.getDeployedAddress(
        params.waitFinalExecution,
      );

      return new SmartContract(this, deployedAddress);
    } catch (error) {
      throw errorHandler(operationType.DeploySC, error);
    }
  }

  async getOperationStatus(opId: string): Promise<OperationStatus> {
    const client = await getClient();
    return client.getOperationStatus(opId);
  }

  async getEvents(filter: EventFilter): Promise<rpcTypes.OutputEvents> {
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

  executeSC(): Promise<Operation> {
    throw new Error('Method not implemented.');
  }
}
