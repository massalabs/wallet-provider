import {
  Args,
  IContractReadOperationData,
  IContractReadOperationResponse,
} from '@massalabs/web3-utils';
import { ITransactionDetails } from '..';
import {
  IAccountBalanceResponse,
  IAccountDetails,
  IAccountSignResponse,
} from '../account';
import { IAccount } from '../account/IAccount';
import { ArgTypes, CallParam, web3 } from '@hicaru/bearby.js';
import { postRequest, getRequest } from '../massaStation/RequestHandler';
import { BalanceResponse } from './BalanceResponse';

/**
 * The maximum allowed gas for a read operation
 */
const MAX_READ_BLOCK_GAS = BigInt(4_294_967_295);

/**
 * The RPC we are using to query the node
 */
export const PUBLIC_NODE_RPC = "https://buildnet.massa.net/api/v2";

export enum OperationsType {
  Payment,
  RollBuy,
  RollSell,
  ExecuteSC,
  CallSC,
}

export class BearbyAccount implements IAccount {
  private _providerName: string;
  private _address: string;
  private _name: string;

  public constructor({ address, name }: IAccountDetails, providerName: string) {
    this._address = address;
    this._name = name ?? '';
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

  // needs testing
  public async balance(): Promise<IAccountBalanceResponse> { // Not available on bearby. we have to manually call the api
    const body = 
      {
        jsonrpc: "2.0",
        method: "get_addresses",
        params: [[this._address]],
        id: 0
      }
    const addressInfos = await postRequest<BalanceResponse>(
      PUBLIC_NODE_RPC,
      body,
    );
    if (addressInfos.isError || addressInfos.error) {
      throw addressInfos.error.message;
    }
    
    return {
      finalBalance: addressInfos.result[0].final_balance,
      candidateBalance: addressInfos.result[0].candidate_balance,
    } as IAccountBalanceResponse;

  }

  // need testing
  public async sign(data: Uint8Array | string): Promise<IAccountSignResponse> {
    const encoder = new TextEncoder();
    if (typeof data === 'string') {
      return {
        publicKey: (await web3.wallet.signMessage(data)).publicKey,
        signature: encoder.encode(
          (await web3.wallet.signMessage(data)).signature,
        ),
      } as IAccountSignResponse;
    }
    const strData = new TextDecoder().decode(data);
    return {
      publicKey: (await web3.wallet.signMessage(strData)).publicKey,
      signature: encoder.encode(
        (await web3.wallet.signMessage(strData)).signature,
      ),
    } as IAccountSignResponse;
  }

  // need testing
  public async buyRolls(
    amount: bigint,
    fee: bigint,
  ): Promise<ITransactionDetails> {
    const signedTx = await web3.wallet.signTransaction({
      type: OperationsType.RollBuy,
      amount: amount.toString(),
      fee: fee.toString(),
      payload: '', // TODO: check how do we have to set it
    });

    // broadcast the transaction
    const provider = ''; // TODO: GET THE PROVIDER FROM BEARBY (if possible ..)

    throw new Error('Method not implemented.');
  }

  // need testing
  public async sellRolls(
    amount: bigint,
    fee: bigint,
  ): Promise<ITransactionDetails> {
    const signedTx = await web3.wallet.signTransaction({
      type: OperationsType.RollSell,
      amount: amount.toString(),
      fee: fee.toString(),
      payload: '', // TODO: check how do we have to set it
    });

    // broadcast the transaction
    const provider = ''; // TODO: GET THE PROVIDER FROM BEARBY

    throw new Error('Method not implemented.');
  }

  public async sendTransaction(
    amount: bigint,
    recipientAddress: string,
    fee: bigint,
  ): Promise<ITransactionDetails> {
    const signedTx = await web3.wallet.signTransaction({
      type: OperationsType.Payment,
      amount: amount.toString(),
      recipient: recipientAddress,
      fee: fee.toString(),
      payload: '', // TODO: check how do we have to set it
    });

    // broadcast the transaction
    const provider = ''; // TODO: GET THE PROVIDER FROM BEARBY

    throw new Error('Method not implemented.');
  }

  public async callSC(
    contractAddress: string,
    functionName: string,
    parameter: Uint8Array | Args,
    amount: bigint,
    fee: bigint,
    maxGas: bigint,
    nonPersistentExecution = false,
  ) {
    if (parameter instanceof Uint8Array) {
      throw new Error(
        'Bearby wallet does not support protobuf serialized parameters. PLease use another wallet such as MassaStation',
      );
    }

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

    const formattedParameter: CallParam[] = [];

    // TODO: find a way to get all the arguments from parameter (= deserialize them) and add them to formattedParameter
    // if (parameter instanceof Uint8Array) {
    //   formatedParameter.push({
    //     type: ArgTypes.U256,
    //     value: parameter,
    //   });
    // }
    const hash = await web3.contract.call({
      fee: Number(fee), // should be a bigint or string to avoid overflow
      maxGas: Number(maxGas), // should be a bigint or string to avoid overflow
      coins: Number(amount), // should be a bigint or string to avoid overflow
      targetAddress: contractAddress,
      functionName: functionName,
      parameters: formattedParameter,
    });

    throw new Error('Method not implemented.');
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
