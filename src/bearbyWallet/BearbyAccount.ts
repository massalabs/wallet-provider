import {
  Args,
  IContractReadOperationData,
  IContractReadOperationResponse,
} from '@massalabs/web3-utils';
import { ITransactionDetails } from '..';
import { IAccountBalanceResponse, IAccountDetails } from '../account';
import { IAccount } from '../account/IAccount';
import { web3 } from '@hicaru/bearby.js';
import {
  postRequest,
  JsonRpcResponseData,
} from '../massaStation/RequestHandler';
import { BalanceResponse } from './BalanceResponse';
import { NodeStatus } from './NodeStatus';
import { JSON_RPC_REQUEST_METHOD } from './jsonRpcMethods';
import axios, { AxiosRequestHeaders, AxiosResponse } from 'axios';
import { IAccountSignOutput } from '../account/AccountSign';
import { isArrayOfNumbers } from '../utils/typeCheck';
/**
 * The maximum allowed gas for a read operation
 */
const MAX_READ_BLOCK_GAS = BigInt(4_294_967_295);

/**
 * The RPC we are using to query the node
 */
export const PUBLIC_NODE_RPC = 'https://buildnet.massa.net/api/v2';

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

const requestHeaders = {
  Accept:
    'application/json,text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Content-Type': 'application/json',
} as AxiosRequestHeaders;

export class BearbyAccount implements IAccount {
  private _providerName: string;
  private _address: string;
  private _name: string;
  private _nodeUrl = PUBLIC_NODE_RPC;

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

  // needs testing
  public async balance(): Promise<IAccountBalanceResponse> {
    await this.connect();
    // Not available on bearby. we have to manually call the api
    const body = {
      jsonrpc: '2.0',
      method: 'get_addresses',
      params: [[this._address]],
      id: 0,
    };

    const addressInfos = await postRequest<BalanceResponse>(
      PUBLIC_NODE_RPC,
      body,
    );

    if (addressInfos.isError || addressInfos.error) {
      throw addressInfos.error.message;
    }
    return {
      finalBalance: addressInfos.result.result[0].final_balance,
      candidateBalance: addressInfos.result.result[0].candidate_balance,
    } as IAccountBalanceResponse;
  }

  // need testing
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
    const signature = await web3.wallet.signMessage(strData);
    return {
      publicKey: signature.publicKey,
      base58Encoded: signature.signature,
    };
  }

  // need testing
  public async buyRolls(
    amount: bigint,
    fee: bigint,
  ): Promise<ITransactionDetails> {
    await this.connect();
    const operationId = await web3.massa.buyRolls(amount.toString());

    return {
      operationId,
    } as ITransactionDetails;
  }

  // need testing
  public async sellRolls(
    amount: bigint,
    fee: bigint,
  ): Promise<ITransactionDetails> {
    await this.connect();
    const operationId = await web3.massa.sellRolls(amount.toString());

    return {
      operationId,
    } as ITransactionDetails;
  }

  public async sendTransaction(
    amount: bigint,
    recipientAddress: string,
    fee: bigint,
  ): Promise<ITransactionDetails> {
    await this.connect();

    const operationId = await web3.massa.payment(
      amount.toString(),
      recipientAddress,
    );

    return {
      operationId,
    } as ITransactionDetails;
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

    const operationId = await web3.contract.call({
      maxGas: Number(maxGas),
      coins: Number(amount),
      fee: Number(fee),
      targetAddress: contractAddress,
      functionName: functionName,
      unsafeParameters: isArrayOfNumbers(parameter)
        ? (parameter as Uint8Array)
        : ((parameter as Args).serialize() as unknown as Uint8Array),
    });

    return { operationId };
  }

  /**
   * Retrieves the node's status.
   *
   * @remarks
   * The returned information includes:
   * - Whether the node is reachable
   * - The number of connected peers
   * - The node's version
   * - The node's configuration parameters
   *
   * @returns A promise that resolves to the node's status information.
   */
  public async getNodeStatus(): Promise<NodeStatus> {
    const jsonRpcRequestMethod = JSON_RPC_REQUEST_METHOD.GET_STATUS;
    return await this.sendJsonRPCRequest<NodeStatus>(jsonRpcRequestMethod, []);
  }

  /**
   * Sends a post JSON rpc request to the node.
   *
   * @param resource - The rpc method to call.
   * @param params - The parameters to pass to the rpc method.
   *
   * @throws An error if the rpc method returns an error.
   *
   * @returns A promise that resolves as the result of the rpc method.
   */
  protected async sendJsonRPCRequest<T>(
    resource: JSON_RPC_REQUEST_METHOD,
    params: object,
  ): Promise<T> {
    let resp: JsonRpcResponseData<T> = null;
    resp = await this.promisifyJsonRpcCall(resource, params);

    // in case of rpc error, rethrow the error.
    if (resp.isError || resp.error) {
      throw resp.error;
    }

    return resp.result;
  }

  /**
   * Converts a json rpc call to a promise that resolves as a JsonRpcResponseData
   *
   * @privateRemarks
   * If there is an error while sending the request, the function catches the error, the isError
   * property is set to true, the result property set to null, and the error property set to a
   * new Error object with a message indicating that there was an error.
   *
   * @param resource - The rpc method to call.
   * @param params - The parameters to pass to the rpc method.
   *
   * @returns A promise that resolves as a JsonRpcResponseData.
   */
  private async promisifyJsonRpcCall<T>(
    resource: JSON_RPC_REQUEST_METHOD,
    params: object,
  ): Promise<JsonRpcResponseData<T>> {
    let resp: AxiosResponse<JsonRpcResponseData<T>> = null;

    const body = {
      jsonrpc: '2.0',
      method: resource,
      params: params,
      id: 0,
    };

    try {
      resp = await axios.post(this._nodeUrl, body, { headers: requestHeaders });
    } catch (ex) {
      return {
        isError: true,
        result: null,
        error: new Error('JSON.parse error: ' + String(ex)),
      } as JsonRpcResponseData<T>;
    }

    const responseData: JsonRpcResponseData<T> = resp.data;

    if (responseData.error) {
      return {
        isError: true,
        result: null,
        error: new Error(responseData.error.message),
      } as JsonRpcResponseData<T>;
    }

    return {
      isError: false,
      result: responseData.result as T,
      error: null,
    } as JsonRpcResponseData<T>;
  }

  public async nonPersistentCallSC(
    contractAddress: string,
    functionName: string,
    parameter: Uint8Array | Args,
    amount: bigint,
    fee: bigint,
    maxGas: bigint,
  ): Promise<IContractReadOperationResponse> {
    // not clean but bearby doesn't allow us to get its node urls
    const node = PUBLIC_NODE_RPC;
    // Gas amount check
    if (maxGas > MAX_READ_BLOCK_GAS) {
      throw new Error(
        `
        The gas submitted ${maxGas.toString()} exceeds the max. allowed block gas of 
        ${MAX_READ_BLOCK_GAS.toString()}
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
      coins: Number(amount),
      fee: Number(fee),
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
    try {
      let resp = await postRequest<Array<IContractReadOperationData>>(
        node,
        body,
      );
      if (resp.isError || resp.error) {
        throw resp.error.message;
      }
      jsonRpcCallResult = resp.result;
    } catch (ex) {
      throw new Error(
        `MassaStation account: error while interacting with smart contract: ${ex}`,
      );
    }
    if (jsonRpcCallResult.length <= 0) {
      throw new Error(
        `Read operation bad response. No results array in json rpc response. Inspect smart contract`,
      );
    }
    if (jsonRpcCallResult[0].result.Error) {
      throw new Error(jsonRpcCallResult[0].result.Error);
    }
    return {
      returnValue: new Uint8Array(jsonRpcCallResult[0].result[0].result.Ok),
      info: jsonRpcCallResult[0],
    };
  }
}
