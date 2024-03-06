import {
  Args,
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
import { errorHandler } from '../errors/utils/errorHandler';
import { operationType } from '../utils/constants';
import { bearbyNodeUrl } from './utils/bearbyCommons';
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
      throw errorHandler(operationType.Sign, error);
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
      throw errorHandler(operationType.BuyRolls, error);
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
      throw errorHandler(operationType.SellRolls, error);
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
      throw errorHandler(operationType.SendTransaction, error);
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
      return this.readSc(
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
      throw errorHandler(operationType.CallSC, error);
    }
    return { operationId };
  }

  public async readSc(
    contractAddress: string,
    functionName: string,
    parameters: Uint8Array | Args,
    amount: bigint,
    fee: bigint,
    maxGas: bigint,
  ): Promise<IContractReadOperationResponse> {
    if (maxGas > MAX_GAS_CALL) {
      throw new Error(
        `Gas amount ${maxGas} exceeds the maximum allowed ${MAX_GAS_CALL}.`,
      );
    }

    const args =
      parameters instanceof Uint8Array
        ? Array.from(parameters)
        : Array.from(parameters.serialize());

    const requestBody = [
      {
        jsonrpc: '2.0',
        method: 'execute_read_only_call',
        params: [
          [
            {
              max_gas: Number(maxGas),
              target_address: contractAddress,
              target_function: functionName,
              parameter: args,
              caller_address: this._address,
              coins: amount.toString(),
              fee: fee.toString(),
            },
          ],
        ],
        id: 0,
      },
    ];

    // TODO error if nodeUrl not available
    const response = await postRequest<Array<IContractReadOperationData>>(
      await bearbyNodeUrl(),
      requestBody,
    );

    if (response.isError) throw response.error;

    const operationResult = response.result[0];

    return {
      returnValue: new Uint8Array(operationResult.result[0].result.Ok),
      info: operationResult,
    };
  }
}
