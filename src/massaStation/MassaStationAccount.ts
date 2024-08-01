import { getRequest, postRequest } from './RequestHandler';
import {
  MASSA_STATION_URL,
  MASSA_STATION_ACCOUNTS_URL,
  WALLET_NAME,
} from './MassaStationWallet';
import { argsToBase64, uint8ArrayToBase64 } from '../utils/argsToBase64';
import bs58check from 'bs58check';
import {
  ExecuteFunctionBody,
  MSAccountSignPayload,
  MSAccountSignResp,
  MSBalancesResp,
  MSSendOperationResp,
} from './types';
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
import { getClient, networkInfos } from './utils/network';

/**
 * This module contains the MassaStationAccount class. It is responsible for representing an account in
 * the MassaStation wallet.
 *
 * @remarks
 * This class provides methods to interact with MassaStation account's {@link balance} and to {@link sign} messages.
 *
 */
export class MassaStationAccount implements Provider {
  private _providerName = WALLET_NAME;

  constructor(
    public address: string,
    public accountName: string,
  ) {}

  get providerName(): string {
    return this._providerName;
  }

  public async balance(final = false): Promise<bigint> {
    const res = await getRequest<MSBalancesResp>(
      `${MASSA_STATION_URL}massa/addresses?attributes=balance&addresses=${this.address}`,
    );

    if (res.isError) throw res.error;

    const balances = res.result.addressesAttributes[this.address].balance;

    return Mas.fromString(final ? balances.final : balances.pending);
  }

  public async sign(data: Buffer | Uint8Array | string): Promise<SignedData> {
    // TODO: Massa Station has 2 endpoints sign (to sign operation) and signMessage (to sign a message).
    // To fix the current implementation we provide a dumb description and set DisplayData to true but it
    // must this feature must be implemented in the future.
    const signData: MSAccountSignPayload = {
      description: '',
      message: data.toString(),
      DisplayData: true,
    };

    const res = await postRequest<MSAccountSignResp>(
      `${MASSA_STATION_ACCOUNTS_URL}/${this.accountName}/signMessage`,
      signData,
    );

    if (res.isError) {
      throw errorHandler(operationType.Sign, res.error);
    }

    const signature = bs58check.encode(
      Buffer.from(res.result.signature, 'base64'),
    );

    return {
      publicKey: res.result.publicKey,
      signature,
    };
  }

  private async rollOperation(
    type: operationType.BuyRolls | operationType.SellRolls,
    amount: bigint,
    opts?: OperationOptions,
  ): Promise<Operation> {
    let fee = opts?.fee;
    if (!fee) {
      const client = await getClient();
      fee = await client.getMinimalFee();
    }
    const body = {
      fee: fee.toString(),
      amount: amount.toString(),
      side: type === operationType.BuyRolls ? 'buy' : 'sell',
    };

    const res = await postRequest<MSSendOperationResp>(
      `${MASSA_STATION_ACCOUNTS_URL}/${this.accountName}/rolls`,
      body,
    );

    if (res.isError) {
      throw errorHandler(type, res.error);
    }
    return new Operation(this, res.result.operationId);
  }

  public async buyRolls(
    amount: bigint,
    opts?: OperationOptions,
  ): Promise<Operation> {
    return this.rollOperation(operationType.BuyRolls, amount, opts);
  }

  public async sellRolls(
    amount: bigint,
    opts?: OperationOptions,
  ): Promise<Operation> {
    return this.rollOperation(operationType.SellRolls, amount, opts);
  }

  async transfer(
    to: Address | string,
    amount: bigint,
    opts?: OperationOptions,
  ): Promise<Operation> {
    let fee = opts?.fee;
    if (!fee) {
      const client = await getClient();
      fee = await client.getMinimalFee();
    }
    const body = {
      fee: fee.toString(),
      amount: amount.toString(),
      recipientAddress: to,
    };

    const res = await postRequest<MSSendOperationResp>(
      `${MASSA_STATION_ACCOUNTS_URL}/${this.accountName}/transfer`,
      body,
    );

    if (res.isError) {
      throw errorHandler(operationType.SendTransaction, res.error);
    }

    return new Operation(this, res.result.operationId);
  }

  public async callSC(params: CallSCParams): Promise<Operation> {
    // convert parameter to base64
    let args = '';
    if (params.parameter instanceof Uint8Array) {
      args = uint8ArrayToBase64(params.parameter);
    } else {
      args = argsToBase64(params.parameter);
    }

    let fee = params?.fee;
    if (!fee) {
      const client = await getClient();
      fee = await client.getMinimalFee();
    }

    const body: ExecuteFunctionBody = {
      nickname: this.accountName,
      name: params.func,
      at: params.target,
      args,
      coins: params.coins ? Number(params.coins) : 0,
      fee: fee.toString(),
      // If maxGas is not provided, estimation will be done by MS
      maxGas: params.maxGas ? params.maxGas.toString() : '',
      async: true,
    };

    const res = await postRequest<MSSendOperationResp>(
      `${MASSA_STATION_URL}cmd/executeFunction`,
      body,
    );

    if (res.isError) {
      throw errorHandler('callSmartContract', res.error);
    }
    return new Operation(this, res.result.operationId);
  }

  public async networkInfos(): Promise<Network> {
    return networkInfos();
  }

  public async readSC(params: ReadSCParams): Promise<ReadSCData> {
    // Gas amount check
    if (params.maxGas > MAX_GAS_CALL) {
      throw new Error(
        `
        The gas submitted ${params.maxGas.toString()} exceeds the max. allowed block gas of 
        ${MAX_GAS_CALL.toString()}
        `,
      );
    }

    const client = await getClient();

    let fee = params?.fee;
    if (!fee) {
      fee = await client.getMinimalFee();
    }

    const args = params.parameter ?? new Uint8Array();
    const readOnlyParams = {
      ...params,
      fee,
      parameter:
        args instanceof Uint8Array ? args : Uint8Array.from(args.serialize()),
    };
    // This implementation is wrong. We should use massaStation instead of targeting the node directly.
    return client.executeReadOnlyCall(readOnlyParams);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public async deploySC(_params: DeploySCParams): Promise<SmartContract> {
    throw new Error('Method not implemented.');
  }

  public async getOperationStatus(opId: string): Promise<OperationStatus> {
    const client = await getClient();
    // This implementation is wrong. We should use massaStation instead of targeting the node directly.
    return client.getOperationStatus(opId);
  }

  public async getEvents(filter: EventFilter): Promise<SCEvent[]> {
    const client = await getClient();
    // This implementation is wrong. We should use massaStation instead of targeting the node directly.
    return client.getEvents(filter);
  }
}
