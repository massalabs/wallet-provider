import {
  AddressInfo,
  EventFilterParam,
  JsonRPCResponseFilteredSCOutputEvent,
  web3,
} from '@hicaru/bearby.js';
import { errorHandler } from '../errors/utils/errorHandler';
import { operationType } from '../utils/constants';
import {
  Address,
  CallSCParams,
  DeploySCParams,
  EventFilter,
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
        throw res.error;
      }

      // TODO: fix typings in bearby.js to avoid this cast
      const { final_balance, candidate_balance } = res.result[0] as AddressInfo;

      return Mas.fromString(final ? final_balance : candidate_balance);
    } catch (error) {
      const errorMessage = `An unexpected error occurred while fetching the account balance: ${
        error.message || 'Unknown error'
      }.`;

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
      const res = await web3.contract.readSmartContract({
        // TODO: add bigint support in bearby.js
        maxGas: Number(params.maxGas),
        coins: Number(params.coins),
        fee: Number(params.fee),
        targetAddress: params.target,
        targetFunction: params.func,
        // TODO: it seems the type of parameter is wrong in bearby.js
        parameter: unsafeParameters as any,
      });

      console.log('bearby readSC res', res[0]);
      const data = res[0].result[0];

      return {
        value: data.result as any,
        info: {
          error: data.result as any,
          events: data.output_events.map((event: any) => ({
            data: event.data,
            // todo fix bearby.js typings
            context: event.context,
          })),
          // TODO: where is gas_cost ? fix bearby.js
          gasCost: 0,
        },
      };
    } catch (error) {
      throw new Error(
        `An error occurred while reading the smart contract: ${error.message}`,
      );
    }
  }

  public async deploySC(params: DeploySCParams): Promise<SmartContract> {
    // TODO: Implement deploySC using web3.contract.deploy
    throw new Error('Method not implemented.');
  }

  public async getOperationStatus(opId: string): Promise<OperationStatus> {
    try {
      const res = (await web3.massa.getOperations(opId)) as any;
      console.log('todo check typings of this...');
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

  public async getEvents(filter: EventFilter): Promise<SCEvent[]> {
    const formattedFilter: EventFilterParam = {
      start: filter.start,
      end: filter.end,
      emitter_address: filter.smartContractAddress,
      original_caller_address: filter.callerAddress,
      original_operation_id: filter.operationId,
      // Followings filters are not supported in bearby.js
      // TODO: either implement them in bearby.js or throw an error
      // is_final: filter.isFinal,
      // is_error: filter.isError,
    };

    try {
      const res = (await web3.contract.getFilteredSCOutputEvent(
        filter,
      )) as JsonRPCResponseFilteredSCOutputEvent;
      return res.result.map((event) => ({
        // TODO check bearby.js typings
        data: event.datastring,
        context: event.context,
      })) as any;
    } catch (error) {
      throw new Error(
        `An error occurred while fetching the operation status: ${error.message}`,
      );
    }
  }
}
