import { errorHandler } from '../errors/utils/errorHandler';
import { operationType } from '../utils/constants';
import {
  Address,
  CallSCParams,
  DatastoreEntry,
  DeploySCParams,
  EventFilter,
  formatNodeStatusObject,
  JsonRPCClient,
  MAX_GAS_CALL,
  Network,
  NodeStatusInfo,
  Operation,
  OperationOptions,
  OperationStatus,
  Provider,
  ReadSCData,
  ReadSCParams,
  SCEvent,
  SignedData,
  SmartContract,
  strToBytes,
} from '@massalabs/massa-web3';

import { WalletName } from '../wallet';
import { getClient, networkInfos } from '../massaStation/utils/network';
import { MetaMaskInpageProvider } from '@metamask/providers';
import { MASSA_SNAP_ID } from './config';
import { web3 } from '@hicaru/bearby.js';
import { AccountBalanceResponse } from './types/snap';

export class MetamaskAccount implements Provider {
  public constructor(
    public address: string,
    private provider: MetaMaskInpageProvider,
  ) {}

  get accountName(): string {
    return this.address;
  }

  get providerName(): string {
    return WalletName.Metamask;
  }

  public async balance(final = false): Promise<bigint> {
    const params = {
      address: this.address,
    };

    const res = await this.provider.request<AccountBalanceResponse>({
      method: 'wallet_invokeSnap',
      params: {
        snapId: MASSA_SNAP_ID,
        request: {
          method: 'account.balance',
          params,
        },
      },
    });

    return final ? BigInt(res.finalBalance) : BigInt(res.candidateBalance);
  }

  public async networkInfos(): Promise<Network> {
    // TODO: update to use snap
    return networkInfos();
  }

  public async sign(data: Buffer | Uint8Array | string): Promise<SignedData> {
    // TODO: update to use snap

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
    // TODO: update to use snap

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
    // TODO: update to use snap

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
    // TODO: update to use snap

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
    // TODO: update to use snap
    const { minimalFee } = await this.networkInfos();
    return minimalFee;
  }

  public async callSC(params: CallSCParams): Promise<Operation> {
    // TODO: update to use snap

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
    // TODO: update to use snap
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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public async deploySC(_params: DeploySCParams): Promise<SmartContract> {
    // TODO: Check if snap has deploy method
    throw new Error('Method not implemented.');
  }

  public async getOperationStatus(opId: string): Promise<OperationStatus> {
    const client = await getClient();
    // This implementation is wrong. We should use metamask snap instead of targeting the node directly.
    return client.getOperationStatus(opId);
  }

  public async getEvents(filter: EventFilter): Promise<SCEvent[]> {
    const client = await getClient();
    // This implementation is wrong. We should use metamask snap instead of targeting the node directly.
    return client.getEvents(filter);
  }

  public async getNodeStatus(): Promise<NodeStatusInfo> {
    const client = await getClient();
    // This implementation is wrong. We should use metamask snap instead of targeting the node directly.
    const status = await client.status();
    return formatNodeStatusObject(status);
  }

  public async getStorageKeys(
    address: string,
    filter: Uint8Array | string = new Uint8Array(),
    final = true,
  ): Promise<Uint8Array[]> {
    const client = await getClient();
    const filterBytes: Uint8Array =
      typeof filter === 'string' ? strToBytes(filter) : filter;
    // This implementation is wrong. We should use metamask snap instead of targeting the node directly.
    return client.getDataStoreKeys(address, filterBytes, final);
  }

  public async readStorage(
    address: string,
    keys: Uint8Array[] | string[],
    final = true,
  ): Promise<Uint8Array[]> {
    const client = await getClient();
    const entries: DatastoreEntry[] = keys.map((key) => ({
      key,
      address,
    }));
    // This implementation is wrong. We should use metamask snap instead of targeting the node directly.
    return client.getDatastoreEntries(entries, final);
  }
}
