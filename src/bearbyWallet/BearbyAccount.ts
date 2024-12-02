import {
  EventFilterParam,
  web3,
  DatastoreEntryInputParam,
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
  JsonRPCClient,
  Mas,
  MAX_GAS_CALL,
  MAX_GAS_DEPLOYMENT,
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
  rpcTypes,
} from '@massalabs/massa-web3';
import { networkInfos } from './utils/network';
import { WalletName } from '../wallet';
import isEqual from 'lodash.isequal';
import { uint8ArrayToBase64 } from 'src/utils/base64';

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

  public async balance(final = false): Promise<bigint> {
    // // TODO: check if we need to connect every time
    // await this.connect();

    try {
      const res = await web3.massa.getAddresses(this.address);

      if (res.error) {
        throw new Error(res.error?.message || 'Bearby getAddresses error');
      }

      const { final_balance, candidate_balance } = res.result[0];

      return Mas.fromString(final ? final_balance : candidate_balance);
    } catch (error) {
      const errorMessage = `An unexpected error occurred while fetching the account balance: ${error.message}.`;

      throw new Error(errorMessage);
    }
  }

  public async networkInfos(): Promise<Network> {
    return networkInfos();
  }

  public async executeSC(): Promise<Operation> {
    throw new Error('Method not implemented.');
  }

  public async sign(data: Buffer | Uint8Array | string): Promise<SignedData> {
    // await this.connect();

    let strData: string;
    if (data instanceof Uint8Array) {
      strData = new TextDecoder().decode(data);
    }
    if (data instanceof Buffer) {
      strData = data.toString();
    }
    try {
      const signature = await web3.wallet.signMessage(strData);

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

    const fee = params?.fee ?? (await this.minimalFee());

    try {
      const operationId = await web3.contract.call({
        // TODO: add bigint support in bearby.js
        // TODO add gas estimation here
        maxGas: Number(params.maxGas || MAX_GAS_CALL),
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
    if (params?.maxGas > MAX_GAS_CALL) {
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
      const network = await this.networkInfos();
      const client =
        network.name === 'mainnet'
          ? JsonRPCClient.mainnet()
          : JsonRPCClient.buildnet();
      const readOnlyParams = {
        ...params,
        caller,
        fee,
        parameter: unsafeParameters,
      };
      return client.executeReadOnlyCall(readOnlyParams);
    } catch (error) {
      throw new Error(
        `An error occurred while reading the smart contract: ${error.message}`,
      );
    }
  }

  public async deploySC(params: DeploySCParams): Promise<SmartContract> {
    try {
      const fee = Number(params.fee ?? (await this.minimalFee()));
      const totalCost =
        StorageCost.smartContract(params.byteCode.length) + params.coins;

      const args = {
        ...params,
        maxCoins: totalCost,
        maxGas: params.maxGas || MAX_GAS_DEPLOYMENT,
        coins: params.coins,
        fee: fee,
        gasPrice: 10000n, // dummy value waiting for (https://github.com/bearby-wallet/bearby-web3/pull/25)
        contractDataBase64: uint8ArrayToBase64(params.byteCode),
        deployerBase64: uint8ArrayToBase64(DEPLOYER_BYTECODE),
      };

      const operationId = await web3.contract.deploy(args);

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

  public async getOperationStatus(opId: string): Promise<OperationStatus> {
    try {
      const res = await web3.massa.getOperations(opId);

      if (res.error) {
        throw new Error(res.error?.message || 'Bearby getOperations error');
      }
      const op = res.result[0] as any; // cast to remove when bearby.js typings are fixed
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
      const res = await web3.contract.getFilteredSCOutputEvent(formattedFilter);

      return (res as any).result; // TODO: to remove when bearby.js typings are fixed
    } catch (error) {
      throw new Error(
        `An error occurred while fetching the operation status: ${error.message}`,
      );
    }
  }

  public async getNodeStatus(): Promise<NodeStatusInfo> {
    const status = await web3.massa.getNodesStatus();
    return formatNodeStatusObject(status.result);
  }

  public async getStorageKeys(
    address: string,
    filter: Uint8Array | string = new Uint8Array(),
    final = true,
  ): Promise<Uint8Array[]> {
    const addressInfo = (await web3.massa.getAddresses(address)).result[0];
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
    const input: DatastoreEntryInputParam[] = keys.map((key) => ({
      key,
      address,
    }));
    const data = await web3.contract.getDatastoreEntries(...input);

    return final
      ? data.map((d) => Uint8Array.from(d.final_value))
      : data.map((d) => Uint8Array.from(d.candidate_value));
  }
}
