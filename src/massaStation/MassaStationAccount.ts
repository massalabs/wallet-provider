import { getRequest, postRequest } from './RequestHandler';
import { walletApiUrl, MASSA_STATION_URL } from './MassaStationWallet';
import {
  argsToBase64,
  base64ToByteArray,
  uint8ArrayToBase64,
} from '../utils/base64';
import {
  DeploySCFunctionBody,
  ExecuteFunctionBody,
  ExecuteSCBody,
  MSAccountSignPayload,
  MSAccountSignResp,
  MSBalancesResp,
  MSDeploySCParams,
  MSExecuteScParams,
  MSSendOperationResp,
} from './types';
import { errorHandler } from '../errors/utils/errorHandler';
import { operationType } from '../utils/constants';
import {
  Address,
  CallSCParams,
  EventFilter,
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
  SignOptions,
  SmartContract,
  rpcTypes,
  StorageCost,
  formatMas,
  DEPLOYER_BYTECODE,
  populateDatastore,
} from '@massalabs/massa-web3';
import { getClient, networkInfos } from './utils/network';
import { WalletName } from '../wallet';
import bs58check from 'bs58check';

/**
 * This module contains the MassaStationAccount class. It is responsible for representing an account in
 * the MassaStation wallet.
 *
 * @remarks
 * This class provides methods to interact with MassaStation account's {@link balance} and to {@link sign} messages.
 *
 */
export class MassaStationAccount implements Provider {
  private _providerName = WalletName.MassaWallet;

  constructor(
    public address: string,
    public accountName: string,
  ) {}

  get providerName(): string {
    return this._providerName;
  }

  public async balance(final = false): Promise<bigint> {
    const { result } = await getRequest<MSBalancesResp>(
      `${MASSA_STATION_URL}massa/addresses?attributes=balance&addresses=${this.address}`,
    );

    const balances = result.addressesAttributes[this.address].balance;

    return Mas.fromString(final ? balances.final : balances.pending);
  }

  async balanceOf(
    addresses: string[],
    final = false,
  ): Promise<{ address: string; balance: bigint }[]> {
    const queryParams = new URLSearchParams();

    queryParams.append('attributes', 'balance');
    addresses.forEach((address) => {
      queryParams.append('addresses', address);
    });

    const { result } = await getRequest<MSBalancesResp>(
      `${MASSA_STATION_URL}massa/addresses?${queryParams.toString()}`,
    );

    return addresses.map((address) => {
      const balance = result.addressesAttributes[address].balance;

      return {
        address,
        balance: Mas.fromString(final ? balance.final : balance.pending),
      };
    });
  }

  public async sign(
    data: Uint8Array | string,
    opts?: SignOptions,
  ): Promise<SignedData> {
    const signData: MSAccountSignPayload = {
      description: opts?.description ?? '',
      message: typeof data === 'string' ? data : new TextDecoder().decode(data),
      DisplayData: opts?.displayData ?? true,
    };

    try {
      const { result } = await postRequest<MSAccountSignResp>(
        `${walletApiUrl()}/accounts/${this.accountName}/signMessage`,
        signData,
      );

      // MS Wallet encodes signature in base64... so we need to decode it en re-encode it in base58
      const signature = bs58check.encode(
        await base64ToByteArray(result.signature),
      );

      return {
        publicKey: result.publicKey,
        signature,
      };
    } catch (error) {
      throw errorHandler(operationType.Sign, error);
    }
  }

  private async minimalFee(): Promise<bigint> {
    const client = await getClient();
    const { minimalFee } = await client.networkInfos();
    return minimalFee;
  }

  private async rollOperation(
    type: operationType.BuyRolls | operationType.SellRolls,
    amount: bigint,
    opts?: OperationOptions,
  ): Promise<Operation> {
    let fee = opts?.fee ?? (await this.minimalFee());

    const body = {
      fee: fee.toString(),
      amount: amount.toString(),
      side: type === operationType.BuyRolls ? 'buy' : 'sell',
    };
    try {
      const { result } = await postRequest<MSSendOperationResp>(
        `${walletApiUrl()}/accounts/${this.accountName}/rolls`,
        body,
      );

      return new Operation(this, result.operationId);
    } catch (error) {
      throw errorHandler(type, error);
    }
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
    const fee = opts?.fee ?? (await this.minimalFee());

    const body = {
      fee: fee.toString(),
      amount: amount.toString(),
      recipientAddress: to.toString(),
    };

    try {
      const { result } = await postRequest<MSSendOperationResp>(
        `${walletApiUrl()}/accounts/${this.accountName}/transfer`,
        body,
      );

      return new Operation(this, result.operationId);
    } catch (error) {
      throw errorHandler(operationType.SendTransaction, error);
    }
  }

  public async callSC(params: CallSCParams): Promise<Operation> {
    // convert parameter to base64
    let args = '';
    if (params.parameter) {
      if (params.parameter instanceof Uint8Array) {
        args = uint8ArrayToBase64(params.parameter);
      } else {
        args = argsToBase64(params.parameter);
      }
    }

    let fee = params?.fee ?? (await this.minimalFee());

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

    try {
      const { result } = await postRequest<MSSendOperationResp>(
        `${MASSA_STATION_URL}cmd/executeFunction`,
        body,
      );

      return new Operation(this, result.operationId);
    } catch (error) {
      throw errorHandler('callSmartContract', error);
    }
  }

  public async networkInfos(): Promise<Network> {
    return networkInfos();
  }

  public async readSC(params: ReadSCParams): Promise<ReadSCData> {
    // Gas amount check
    if (params.maxGas && params.maxGas > MAX_GAS_CALL) {
      throw new Error(
        `
        The gas submitted ${params.maxGas.toString()} exceeds the max. allowed block gas of 
        ${MAX_GAS_CALL.toString()}
        `,
      );
    }

    const client = await getClient();

    const fee = params?.fee ?? (await this.minimalFee());
    const caller = params.caller ?? this.address;
    const args = params.parameter ?? new Uint8Array();
    const readOnlyParams = {
      ...params,
      caller,
      fee,
      parameter:
        args instanceof Uint8Array ? args : Uint8Array.from(args.serialize()),
    };
    // This implementation is wrong. We should use massaStation instead of targeting the node directly.
    return client.readSC(readOnlyParams);
  }

  public async deploySC(params: MSDeploySCParams): Promise<SmartContract> {
    try {
      const args = params.parameter ?? new Uint8Array();
      const parameters = args instanceof Uint8Array ? args : args.serialize();
      const coins = params.coins ?? 0n; // If coins is undefined, some vesions of station will have a panic
      const maxCoins =
        params.maxCoins ??
        StorageCost.smartContractDeploy(params.byteCode.length) + coins;
      const fee = params.fee ?? (await this.minimalFee());

      let maxGas = params.maxGas;
      if (!maxGas) {
        const client = await getClient();
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

      const description =
        params.description ??
        `${formatMas(coins)} MAS coins allocated to new smart contract`;

      const body: DeploySCFunctionBody = {
        nickname: this.accountName,
        smartContract: uint8ArrayToBase64(params.byteCode),
        coins: coins.toString(),
        parameters: uint8ArrayToBase64(parameters),
        maxCoins: maxCoins.toString(),
        fee: fee.toString(),
        maxGas: maxGas.toString(),
        description,
      };

      const { result } = await postRequest<MSSendOperationResp>(
        `${MASSA_STATION_URL}cmd/deploySC`,
        body,
      );

      const operationId = result?.operationId;

      if (!operationId) throw new Error('Operation ID not found');

      const operation = new Operation(this, operationId);
      const deployedAddress = await operation.getDeployedAddress(
        params.waitFinalExecution,
      );

      return new SmartContract(this, deployedAddress);
    } catch (error) {
      throw new Error(`Error during smart contract deployment: ${error}`);
    }
  }

  async executeSC(params: MSExecuteScParams): Promise<Operation> {
    try {
      const fee = params.fee ?? (await this.minimalFee());
      const maxCoins = params.maxCoins ?? 0n;

      let maxGas = params.maxGas;
      if (!maxGas) {
        const client = await getClient();
        maxGas = await client.executeSCGasEstimation({
          ...params,
          caller: this.address,
        });
      }

      const datastore: [string, string][] = [];
      if (params.datastore) {
        for (const [key, value] of params.datastore.entries()) {
          datastore.push([uint8ArrayToBase64(key), uint8ArrayToBase64(value)]);
        }
      }

      const body: ExecuteSCBody = {
        nickname: this.accountName,
        bytecode: uint8ArrayToBase64(params.byteCode),
        datastore,
        maxCoins: maxCoins.toString(),
        fee: fee.toString(),
        description: params.description ?? '',
      };

      const { result } = await postRequest<MSSendOperationResp>(
        `${MASSA_STATION_URL}cmd/executeSC`,
        body,
      );

      const operationId = result?.operationId;

      if (!operationId) throw new Error('Operation ID not found');

      return new Operation(this, operationId);
    } catch (error) {
      throw new Error(
        `Error during smart contract bytecode execution: ${error}`,
      );
    }
  }

  public async getOperationStatus(opId: string): Promise<OperationStatus> {
    const client = await getClient();
    // This implementation is wrong. We should use massaStation instead of targeting the node directly.
    return client.getOperationStatus(opId);
  }

  public async getEvents(filter: EventFilter): Promise<rpcTypes.OutputEvents> {
    const client = await getClient();
    // This implementation is wrong. We should use massaStation instead of targeting the node directly.
    return client.getEvents(filter);
  }

  public async getNodeStatus(): Promise<NodeStatusInfo> {
    const client = await getClient();
    return client.getNodeStatus();
  }

  public async getStorageKeys(
    address: string,
    filter: Uint8Array | string = new Uint8Array(),
    final = true,
  ): Promise<Uint8Array[]> {
    // This implementation is wrong. We should use massaStation instead of targeting the node directly.
    const client = await getClient();
    return client.getStorageKeys(address, filter, final);
  }

  public async readStorage(
    address: string,
    keys: Uint8Array[] | string[],
    final = true,
  ): Promise<(Uint8Array | null)[]> {
    // This implementation is wrong. We should use massaStation instead of targeting the node directly.
    const client = await getClient();
    return client.readStorage(address, keys, final);
  }
}
