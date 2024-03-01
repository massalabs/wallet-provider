import {
  Args,
  CHAIN_ID_RPC_URL_MAP,
  IContractReadOperationData,
  IContractReadOperationResponse,
  MAX_GAS_CALL,
} from '@massalabs/web3-utils';
import { ITransactionDetails } from '..';
import { IAccountBalanceResponse, IAccountDetails } from '../account';
import { IAccount } from '../account/IAccount';
import { AddressInfo, web3 } from '@hicaru/bearby.js';
import { postRequest } from '../massaStation/RequestHandler';
import { IAccountSignOutput } from '../account/AccountSign';
import { operationErrorMapping } from '../errors/utils/errorMapping';
/**
 * The maximum allowed gas for a read operation
 */

export enum OperationsType {
  Payment,
  RollBuy,
  RollSell,
  ExecuteSC,
  CallSC,
}

/**
 * Associates an operation type with a number.
 */
export enum OperationTypeId {
  Transaction = 0,
  RollBuy = 1,
  RollSell = 2,
  ExecuteSC = 3,
  CallSC = 4,
}

export class BearbyAccount implements IAccount {
  private _providerName: string;
  private _address: string;
  private _name: string;

  public constructor({ address, name }: IAccountDetails, providerName: string) {
    this._address = address;
    this._name = name ?? 'Bearby_account';
    this._providerName = providerName;
  }

  public address(): string {
    return this._address;
  }

  public name(): string {
    return this._name;
  }

  public providerName(): string {
    return this._providerName;
  }

  public async connect() {
    try {
      await web3.wallet.connect();
    } catch (ex) {
      console.log('Bearby connection error: ', ex);
    }
  }

  public async balance(): Promise<IAccountBalanceResponse> {
    // TODO: check if we need to connect every time
    await this.connect();

    try {
      const res = await web3.massa.getAddresses(this._address);

      if (res.error) {
        throw res.error;
      }

      const addressInfo = res.result[0] as AddressInfo;

      return {
        finalBalance: addressInfo.final_balance,
        candidateBalance: addressInfo.candidate_balance,
      };
    } catch (error) {
      const errorMessage = `An unexpected error occurred while fetching the account balance: ${
        error.message || 'Unknown error'
      }.`;

      throw new Error(errorMessage);
    }
  }

  public async sign(
    data: Buffer | Uint8Array | string,
  ): Promise<IAccountSignOutput> {
    await this.connect();

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
        base58Encoded: signature.signature,
      };
    } catch (error) {
      throw operationErrorMapping('sign', error);
    }
  }

  public async buyRolls(amount: bigint): Promise<ITransactionDetails> {
    await this.connect();
    try {
      const operationId = await web3.massa.buyRolls(amount.toString());
      return {
        operationId,
      };
    } catch (error) {
      throw operationErrorMapping('buyRolls', error);
    }
  }

  public async sellRolls(amount: bigint): Promise<ITransactionDetails> {
    await this.connect();
    try {
      const operationId = await web3.massa.sellRolls(amount.toString());
      return {
        operationId,
      };
    } catch (error) {
      throw operationErrorMapping('sellRolls', error);
    }
  }

  public async sendTransaction(
    amount: bigint,
    recipientAddress: string,
  ): Promise<ITransactionDetails> {
    await this.connect();

    try {
      const operationId = await web3.massa.payment(
        amount.toString(),
        recipientAddress,
      );

      return { operationId };
    } catch (error) {
      throw operationErrorMapping('sendTransaction', error);
    }
  }

  public async callSC(
    contractAddress: string,
    functionName: string,
    parameter: Args | Uint8Array,
    amount: bigint,
    fee: bigint,
    maxGas: bigint,
    nonPersistentExecution = false,
  ): Promise<ITransactionDetails | IContractReadOperationResponse> {
    await this.connect();

    if (nonPersistentExecution) {
      return this.nonPersistentCallSC(
        contractAddress,
        functionName,
        parameter,
        amount,
        fee,
        maxGas,
      );
    }

    const unsafeParameters =
      parameter instanceof Uint8Array
        ? parameter
        : Uint8Array.from(parameter.serialize());
    let operationId;
    try {
      operationId = await web3.contract.call({
        maxGas: Number(maxGas),
        coins: Number(amount),
        fee: Number(fee),
        targetAddress: contractAddress,
        functionName: functionName,
        unsafeParameters,
      });
    } catch (error) {
      throw operationErrorMapping('callSC', error);
    }
    return { operationId };
  }

  public async nonPersistentCallSC(
    contractAddress: string,
    functionName: string,
    parameter: Uint8Array | Args,
    amount: bigint,
    fee: bigint,
    maxGas: bigint,
  ): Promise<IContractReadOperationResponse> {
    // Gas amount check
    if (maxGas > MAX_GAS_CALL) {
      throw new Error(
        `
        The gas submitted ${maxGas.toString()} exceeds the max. allowed block gas of 
        ${MAX_GAS_CALL.toString()}
        `,
      );
    }

    // convert parameter to an array of numbers
    let argumentArray = [];
    if (parameter instanceof Uint8Array) {
      argumentArray = Array.from(parameter);
    } else {
      argumentArray = Array.from(parameter.serialize());
    }
    // setup the request body
    const data = {
      max_gas: Number(maxGas),
      target_address: contractAddress,
      target_function: functionName,
      parameter: argumentArray,
      caller_address: this._address,
      coins: amount.toString(),
      fee: fee.toString(),
    };

    const body = [
      {
        jsonrpc: '2.0',
        method: 'execute_read_only_call',
        params: [[data]],
        id: 0,
      },
    ];
    // returns operation ids
    let jsonRpcCallResult: Array<IContractReadOperationData> = [];
    const nodeUrl = await getNodesUrl();
    try {
      let resp = await postRequest<Array<IContractReadOperationData>>(
        nodeUrl,
        body,
      );
      if (resp.isError || resp.error) {
        throw resp.error.message;
      }
      jsonRpcCallResult = resp.result;
    } catch (ex) {
      throw new Error(
        `Bearby account: error while interacting with smart contract: ${ex}`,
      );
    }
    if (jsonRpcCallResult.length <= 0) {
      throw new Error(
        `Read operation bad response. No results array in json rpc response. Inspect smart contract`,
      );
    }
    if (jsonRpcCallResult[0].result?.Error) {
      throw new Error(jsonRpcCallResult[0].result.Error);
    }
    return {
      returnValue: new Uint8Array(jsonRpcCallResult[0].result[0].result.Ok),
      info: jsonRpcCallResult[0],
    };
  }
}

// TODO: Should be removed from account when bearby.js is updated
async function getNodesUrl(): Promise<string> {
  const info = (await web3.massa.getNodesStatus()) as any;
  return CHAIN_ID_RPC_URL_MAP[info.result.chain_id];
}
