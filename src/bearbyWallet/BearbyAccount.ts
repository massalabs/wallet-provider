import { EventFilterParam, web3, AddressInfo } from '@hicaru/bearby.js';
import { errorHandler } from '../errors/utils/errorHandler';
import { operationType } from '../utils/constants';
import {
  Address,
  CallSCParams,
  DeploySCParams,
  EventFilter,
  JsonRPCClient,
  Mas,
  MAX_GAS_CALL,
  Network,
  Operation,
  OperationOptions,
  OperationStatus,
  Provider,
  ReadSCData,
  ReadSCParams,
  SCEvent,
  SignedData,
  SmartContract,
} from '@massalabs/massa-web3';
import { WALLET_NAME } from './BearbyWallet';
import { networkInfos } from './utils/network';

export class BearbyAccount implements Provider {
  public constructor(public address: string) {}

  get accountName(): string {
    return this.address;
  }

  get providerName(): string {
    return WALLET_NAME;
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
        throw new Error(res.error?.message || 'Bearby unknown error');
      }

      // TODO: fix typings in bearby.js to avoid this cast
      // https://github.com/bearby-wallet/bearby-web3/pull/19
      const { final_balance, candidate_balance } = res.result[0] as AddressInfo;

      return Mas.fromString(final ? final_balance : candidate_balance);
    } catch (error) {
      const errorMessage = `An unexpected error occurred while fetching the account balance: ${error.message}.`;

      throw new Error(errorMessage);
    }
  }

  public async networkInfos(): Promise<Network> {
    return networkInfos();
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

  public async callSC(params: CallSCParams): Promise<Operation> {
    // await this.connect();

    const args = params.parameter ?? new Uint8Array();
    const unsafeParameters =
      args instanceof Uint8Array ? args : Uint8Array.from(args.serialize());

    try {
      const operationId = await web3.contract.call({
        // TODO: add bigint support in bearby.js
        maxGas: Number(params.maxGas),
        coins: Number(params.coins),
        fee: Number(params.fee),
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
    if (params.maxGas > MAX_GAS_CALL) {
      throw new Error(
        `Gas amount ${params.maxGas} exceeds the maximum allowed ${MAX_GAS_CALL}.`,
      );
    }

    const args = params.parameter ?? new Uint8Array();
    const unsafeParameters =
      args instanceof Uint8Array ? args : Uint8Array.from(args.serialize());

    try {
      // const res = await web3.contract.readSmartContract({
      //   // TODO: add bigint support in bearby.js
      //   maxGas: Number(params.maxGas),
      //   coins: Number(params.coins),
      //   fee: Number(params.fee),
      //   targetAddress: params.target,
      //   targetFunction: params.func,
      //   // TODO: add unsafeParameters to bearby.js
      //   // https://github.com/bearby-wallet/bearby-web3/pull/18
      //   parameter: unsafeParameters as any,
      // });

      // console.log('bearby readSC res', res[0]);
      // const data = res[0].result[0];

      // return {
      //   value: data.result as any,
      //   info: {
      //     error: data.result as any,
      //     events: data.output_events.map((event: any) => ({
      //       data: event.data,
      //       // todo fix bearby.js typings
      //       // https://github.com/bearby-wallet/bearby-web3/pull/20
      //       context: event.context,
      //     })),
      //     // TODO: where is gas_cost ? fix bearby.js
      //     gasCost: 0,
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
        parameter: unsafeParameters,
        caller: this.address,
      };
      return client.executeReadOnlyCall(readOnlyParams);
    } catch (error) {
      throw new Error(
        `An error occurred while reading the smart contract: ${error.message}`,
      );
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public async deploySC(_params: DeploySCParams): Promise<SmartContract> {
    // TODO: Implement deploySC using web3.contract.deploy
    throw new Error('Method not implemented.');
  }

  public async getOperationStatus(opId: string): Promise<OperationStatus> {
    try {
      // todo fix bearby.js typings
      // https://github.com/bearby-wallet/bearby-web3/pull/21
      const res = await web3.massa.getOperations(opId);

      if (res.error) {
        throw new Error(res.error?.message || 'Bearby unknown error');
      }
      const op = res.result[0] as any;
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

  public async getEvents(filter: EventFilter): Promise<SCEvent[]> {
    const formattedFilter: EventFilterParam = {
      start: filter.start,
      end: filter.end,
      emitter_address: filter.smartContractAddress,
      original_caller_address: filter.callerAddress,
      original_operation_id: filter.operationId,
      // Followings filters are not supported in bearby.js
      // TODO: either implement them in bearby.js or throw an error
      // https://github.com/bearby-wallet/bearby-web3/pull/20
      // is_final: filter.isFinal,
      // is_error: filter.isError,
    };

    try {
      const res = web3.contract.getFilteredSCOutputEvent(formattedFilter);
      if (res instanceof Array) {
        return res as any;
      } else {
        return [res] as any;
      }
    } catch (error) {
      throw new Error(
        `An error occurred while fetching the operation status: ${error.message}`,
      );
    }
  }
}
