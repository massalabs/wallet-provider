import {
  EventFilterParam,
  web3,
  DatastoreEntryInputParam,
  JsonRPCResponse,
  ExecuteBytecodeParams,
} from '@hicaru/bearby.js';
import { errorHandler } from '../errors/utils/errorHandler';
import { operationType } from '../utils/constants';
import {
  Address,
  CallSCParams,
  DEPLOYER_BYTECODE,
  DeploySCParams,
  EventFilter,
  formatNodeStatusObject,
  Mas,
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
  StorageCost,
  strToBytes,
  bytesToStr,
  rpcTypes,
  JsonRpcPublicProvider,
  ExecuteScParams,
  populateDatastore,
  ExecuteSCReadOnlyParams,
  ExecuteSCReadOnlyResult,
} from '@massalabs/massa-web3';
import { networkInfos } from './utils/network';
import { WalletName } from '../wallet';
import isEqual from 'lodash.isequal';
import { uint8ArrayToBase64 } from '../utils/base64';

let jsonClient: JsonRpcPublicProvider;

export class BearbyAccount implements Provider {
  public constructor(public address: string) {}

  get accountName(): string {
    return this.address;
  }

  get providerName(): string {
    return WalletName.Bearby;
  }

  // public async connect() {
  //   try {
  //     await web3.wallet.connect();
  //   } catch (ex) {
  //     console.log('Bearby connection error: ', ex);
  //   }
  // }

  private async getClient(): Promise<JsonRpcPublicProvider> {
    if (!jsonClient) {
      const network = await networkInfos();
      jsonClient = (
        network.name === 'mainnet'
          ? JsonRpcPublicProvider.mainnet()
          : JsonRpcPublicProvider.buildnet()
      ) as JsonRpcPublicProvider;
    }
    return jsonClient;
  }

  public async balance(final = false): Promise<bigint> {
    // // TODO: check if we need to connect every time
    // await this.connect();

    try {
      const res = await web3.massa.getAddresses(this.address);

      if (res.error || !res.result) {
        throw new Error(res.error?.message || 'Bearby getAddresses error');
      }

      const { final_balance, candidate_balance } = res.result[0];

      return Mas.fromString(final ? final_balance : candidate_balance);
    } catch (error) {
      const errorMessage = `An unexpected error occurred while fetching the account balance: ${error.message}.`;

      throw new Error(errorMessage);
    }
  }

  public async balanceOf(
    addresses: string[],
    final?: boolean,
  ): Promise<{ address: string; balance: bigint }[]> {
    const res = await web3.massa.getAddresses(...addresses);
    if (res.error || !res.result) {
      throw new Error(res.error?.message || 'Bearby getAddresses error');
    }

    return res.result.map((addressInfo) => {
      const { final_balance, candidate_balance } = addressInfo;
      return {
        address: addressInfo.address,
        balance: Mas.fromString(final ? final_balance : candidate_balance),
      };
    });
  }

  public async networkInfos(): Promise<Network> {
    return networkInfos();
  }

  public async sign(data: Uint8Array | string): Promise<SignedData> {
    // await this.connect();

    if (data instanceof Uint8Array) {
      data = bytesToStr(data);
    }

    try {
      const signature = await web3.wallet.signMessage(data);

      return {
        publicKey: signature.publicKey,
        signature: signature.signature,
      };
    } catch (error) {
      throw errorHandler(operationType.Sign, error);
    }
  }

  public async buyRolls(
    amount: bigint,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _opts?: OperationOptions,
  ): Promise<Operation> {
    // await this.connect();
    try {
      const operationId = await web3.massa.buyRolls(amount.toString());
      return new Operation(this, operationId);
    } catch (error) {
      throw errorHandler(operationType.BuyRolls, error);
    }
  }

  public async sellRolls(
    amount: bigint,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _opts?: OperationOptions,
  ): Promise<Operation> {
    // await this.connect();
    try {
      const operationId = await web3.massa.sellRolls(amount.toString());
      return new Operation(this, operationId);
    } catch (error) {
      throw errorHandler(operationType.SellRolls, error);
    }
  }

  public async transfer(
    to: Address | string,
    amount: bigint,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _opts?: OperationOptions,
  ): Promise<Operation> {
    // await this.connect();

    try {
      const operationId = await web3.massa.payment(
        amount.toString(),
        to.toString(),
      );

      return new Operation(this, operationId);
    } catch (error) {
      throw errorHandler(operationType.SendTransaction, error);
    }
  }

  private async minimalFee(): Promise<bigint> {
    const { minimalFee } = await this.networkInfos();
    return minimalFee;
  }

  public async callSC(params: CallSCParams): Promise<Operation> {
    // await this.connect();

    const args = params.parameter ?? new Uint8Array();
    const unsafeParameters =
      args instanceof Uint8Array ? args : Uint8Array.from(args.serialize());

    const fee = params.fee ?? (await this.minimalFee());

    let maxGas = params.maxGas;
    if (!maxGas) {
      const client = await this.getClient();
      maxGas = await client.getGasEstimation({
        ...params,
        caller: this.address,
      });
    }

    try {
      const operationId = await web3.contract.call({
        // TODO: add bigint support in bearby.js
        maxGas: Number(maxGas),
        coins: Number(params.coins || 0),
        fee: Number(fee),
        targetAddress: params.target,
        functionName: params.func,
        unsafeParameters,
      });
      return new Operation(this, operationId);
    } catch (error) {
      throw errorHandler(operationType.CallSC, error);
    }
  }

  public async readSC(params: ReadSCParams): Promise<ReadSCData> {
    if (params.maxGas && params.maxGas > MAX_GAS_CALL) {
      throw new Error(
        `Gas amount ${params.maxGas} exceeds the maximum allowed ${MAX_GAS_CALL}.`,
      );
    }

    const args = params.parameter ?? new Uint8Array();
    const unsafeParameters =
      args instanceof Uint8Array ? args : Uint8Array.from(args.serialize());

    const fee = params?.fee ?? (await this.minimalFee());
    const caller = params.caller ?? this.address;

    try {
      // const res = await web3.contract.readSmartContract({
      //   // TODO: add bigint support in bearby.js
      //   maxGas: Number(params.maxGas),
      //   coins: Number(params.coins),
      //   fee: Number(fee),
      //   targetAddress: params.target,
      //   targetFunction: params.func,
      //   // TODO: add unsafeParameters to bearby.js
      //   // https://github.com/bearby-wallet/bearby-web3/pull/18
      //   parameter: unsafeParameters as any,
      // });

      // console.log('bearby readSC res', res[0]);
      // const data = res[0].result[0];

      // return {
      //   value: data.result.Ok ? Uint8Array.from(data.result.Ok): new Uint8Array(),
      //   info: {
      //     error: data.result.Error,
      //     events: data.output_events.map((event: SCEvent) => ({
      //       data: event.data,
      //       context: event.context,
      //     })),
      //     gasCost: data.gas_cost,
      //   },
      // };

      // Temp implementation to remove when bearby.js is fixed
      const client = await this.getClient();
      const readOnlyParams = {
        ...params,
        caller,
        fee,
        parameter: unsafeParameters,
      };
      return client.readSC(readOnlyParams);
    } catch (error) {
      throw new Error(
        `An error occurred while reading the smart contract: ${error.message}`,
      );
    }
  }

  public async deploySC(params: DeploySCParams): Promise<SmartContract> {
    try {
      const fee = Number(params.fee ?? (await this.minimalFee()));
      const coins = params.coins ?? 0n;
      const maxCoins =
        params.maxCoins ??
        StorageCost.smartContractDeploy(params.byteCode.length) + coins;

      const args = params.parameter ?? new Uint8Array();
      const parameters = args instanceof Uint8Array ? args : args.serialize();

      let maxGas = params.maxGas;
      if (!maxGas) {
        const client = await this.getClient();

        const datastore = populateDatastore([
          {
            data: params.byteCode,
            args: parameters,
            coins,
          },
        ]);

        maxGas = await client.executeSCGasEstimation({
          ...params,
          byteCode: DEPLOYER_BYTECODE,
          datastore,
          caller: this.address,
        });
      }

      const bearbyParams = {
        maxCoins,
        maxGas,
        coins,
        fee,
        contractDataBase64: uint8ArrayToBase64(params.byteCode),
        deployerBase64: uint8ArrayToBase64(DEPLOYER_BYTECODE),
        unsafeParameters: parameters,
      };

      const operationId = await web3.contract.deploy(bearbyParams);

      const operation = new Operation(this, operationId);

      const deployedAddress = await operation.getDeployedAddress(
        params.waitFinalExecution,
      );

      return new SmartContract(this, deployedAddress);
    } catch (error) {
      console.error('Error deploying smart contract:', error);
      throw new Error(`Failed to deploy smart contract: ${error.message}`);
    }
  }

  public async executeSC(params: ExecuteScParams): Promise<Operation> {
    const fee = params.fee ?? (await this.minimalFee());
    let maxGas = params.maxGas;
    if (!maxGas) {
      const client = await this.getClient();
      maxGas = await client.executeSCGasEstimation({
        ...params,
        caller: this.address,
      });
    }

    const args: ExecuteBytecodeParams = {
      maxCoins: params.maxCoins ?? 0n,
      maxGas,
      fee,
      bytecodeBase64: uint8ArrayToBase64(params.byteCode),
      datastore: params.datastore ?? new Map<Uint8Array, Uint8Array>(),
    };

    const operationId = await web3.contract.executeBytecode(args);

    return new Operation(this, operationId);
  }

  async executeSCReadOnly(
    params: ExecuteSCReadOnlyParams,
  ): Promise<ExecuteSCReadOnlyResult> {
    try {
      const client = await this.getClient();
      return client.executeSCReadOnly(params);
    } catch (error) {
      throw new Error(
        `Error during readonly smart contract bytecode execution: ${error}`,
      );
    }
  }

  public async getOperationStatus(opId: string): Promise<OperationStatus> {
    try {
      const res = await web3.massa.getOperations(opId);

      if (res.error || !res.result) {
        throw new Error(res.error?.message || 'Bearby getOperations error');
      }
      const op = res.result[0];
      if (op.op_exec_status === null) {
        if (op.is_operation_final === null) {
          return OperationStatus.NotFound;
        }
        throw new Error('unexpected status');
      }

      if (op.in_pool) {
        return OperationStatus.PendingInclusion;
      }

      if (!op.is_operation_final) {
        return op.op_exec_status
          ? OperationStatus.SpeculativeSuccess
          : OperationStatus.SpeculativeError;
      }

      return op.op_exec_status
        ? OperationStatus.Success
        : OperationStatus.Error;
    } catch (error) {
      throw new Error(
        `An error occurred while fetching the operation status: ${error.message}`,
      );
    }
  }

  public async getEvents(filter: EventFilter): Promise<rpcTypes.OutputEvents> {
    const formattedFilter: EventFilterParam = {
      start: filter.start,
      end: filter.end,
      emitter_address: filter.smartContractAddress,
      original_caller_address: filter.callerAddress,
      original_operation_id: filter.operationId,
      is_final: filter.isFinal,
      is_error: filter.isError,
    };

    try {
      /* 
        Currently getFilteredSCOutputEvent is supposed to return a JsonRPCResponseFilteredSCOutputEvent object.
        But in practice it's returning an array of JsonRPCResponse<rpcTypes.OutputEvents> objects.
      */
      const res = (await web3.contract.getFilteredSCOutputEvent(
        formattedFilter,
      )) as JsonRPCResponse<rpcTypes.OutputEvents>[];

      if (res?.[0]?.error) throw res[0].error;
      return res?.[0]?.result ?? [];
    } catch (error) {
      throw new Error(
        `An error occurred while fetching the operation status: ${error.message}`,
      );
    }
  }

  public async getNodeStatus(): Promise<NodeStatusInfo> {
    const status = await web3.massa.getNodesStatus();
    if (status.error || !status.result) {
      throw new Error(status.error?.message || 'Bearby getNodeStatus error');
    }
    // remove "as any" when this PR is merged https://github.com/bearby-wallet/bearby-web3/pull/28
    return formatNodeStatusObject(status.result as any);
  }

  public async getStorageKeys(
    address: string,
    filter: Uint8Array | string = new Uint8Array(),
    final = true,
  ): Promise<Uint8Array[]> {
    const res = await web3.massa.getAddresses(address);
    if (res.error || !res.result) {
      throw new Error(res.error?.message || 'Bearby getStorageKeys error');
    }

    const addressInfo = res.result[0];
    const keys = final
      ? addressInfo.final_datastore_keys
      : addressInfo.candidate_datastore_keys;

    const filterBytes: Uint8Array =
      typeof filter === 'string' ? strToBytes(filter) : filter;

    return keys
      .filter(
        (key) =>
          !filter.length ||
          isEqual(
            Uint8Array.from(key.slice(0, filterBytes.length)),
            filterBytes,
          ),
      )
      .map((d) => Uint8Array.from(d));
  }

  public async readStorage(
    address: string,
    keys: Uint8Array[] | string[],
    final = true,
  ): Promise<Uint8Array[]> {
    try {
      const input: DatastoreEntryInputParam[] = keys.map((key) => ({
        key,
        address,
      }));
      const data = await web3.contract.getDatastoreEntries(...input);
      const resultArray = data[0]['result'];
      const dataArray = final
        ? resultArray.map((d) => Uint8Array.from(d.final_value))
        : resultArray.map((d) => Uint8Array.from(d.candidate_value));
      return dataArray;
    } catch (error) {
      throw new Error(
        `An error occurred while reading the storage: ${error.message}`,
      );
    }
  }
}
