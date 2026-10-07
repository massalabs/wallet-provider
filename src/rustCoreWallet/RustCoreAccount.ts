import {
  Address,
  CallSCParams,
  EventFilter,
  ExecuteSCReadOnlyParams,
  ExecuteSCReadOnlyResult,
  JsonRpcPublicProvider,
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
  rpcTypes,
  strToBytes,
} from '@massalabs/massa-web3';
import { WalletName } from '../wallet';
import { operationType } from '../utils/constants';
import { uint8ArrayToBase64 } from '../utils/base64';
import { RustCoreInjected, RustCoreNetwork } from './types';
import { rustCoreErrorHandler, toNetwork } from './utils';

// one public client per node url, created on first use
const jsonClients = new Map<string, JsonRpcPublicProvider>();

/**
 * An account the user shared with this site through RustCore Wallet.
 *
 * @remarks
 * Signatures go to the extension, where the user approves each of them.
 * Reads (balances, readSC, events, storage…) need no key: they go straight to
 * a public node of the wallet's current network.
 */
export class RustCoreAccount implements Provider {
  public constructor(
    public readonly address: string,
    private readonly rustcore: RustCoreInjected,
  ) {}

  get accountName(): string {
    return this.address;
  }

  get providerName(): string {
    return WalletName.RustCore;
  }

  public async networkInfos(): Promise<Network> {
    return toNetwork(await this.network());
  }

  // The user can switch network in the wallet at any time: read the current
  // one on every call, so a client for another network is never reused.
  private async getClient(): Promise<JsonRpcPublicProvider> {
    const { url } = await this.network();
    let client = jsonClients.get(url);
    if (!client) {
      client = JsonRpcPublicProvider.fromRPCUrl(url) as JsonRpcPublicProvider;
      jsonClients.set(url, client);
    }
    return client;
  }

  private async network(): Promise<RustCoreNetwork> {
    return (await this.rustcore.request('network')) as RustCoreNetwork;
  }

  // ---------------------------------------------------------------- signing

  public async sign(data: Uint8Array | string): Promise<SignedData> {
    const bytes = typeof data === 'string' ? strToBytes(data) : data;
    try {
      return (await this.rustcore.request('sign', {
        data: uint8ArrayToBase64(bytes),
      })) as SignedData;
    } catch (error) {
      throw rustCoreErrorHandler(operationType.Sign, error);
    }
  }

  public async transfer(
    to: Address | string,
    amount: bigint,
    // the wallet sets the fee: at least the network's minimal fee
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _opts?: OperationOptions,
  ): Promise<Operation> {
    return this.send(operationType.SendTransaction, 'transfer', {
      to: to.toString(),
      amount: amount.toString(),
    });
  }

  public async buyRolls(
    amount: bigint,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _opts?: OperationOptions,
  ): Promise<Operation> {
    return this.send(operationType.BuyRolls, 'buyRolls', {
      rolls: amount.toString(),
    });
  }

  public async sellRolls(
    amount: bigint,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _opts?: OperationOptions,
  ): Promise<Operation> {
    return this.send(operationType.SellRolls, 'sellRolls', {
      rolls: amount.toString(),
    });
  }

  /**
   * Calls a smart contract. The wallet simulates the call and shows it to the
   * user before signing; `fee` is raised to the network's minimum if lower.
   */
  public async callSC(params: CallSCParams): Promise<Operation> {
    const args = params.parameter ?? new Uint8Array();
    const parameter = args instanceof Uint8Array ? args : args.serialize();
    return this.send(operationType.CallSC, 'callSC', {
      target: params.target,
      func: params.func,
      parameter: uint8ArrayToBase64(parameter),
      coins: (params.coins ?? 0n).toString(),
      ...(params.fee !== undefined && { fee: params.fee.toString() }),
      ...(params.maxGas !== undefined && { maxGas: params.maxGas.toString() }),
    });
  }

  /** Not supported: raw bytecode can't be reviewed by the user. */
  public async executeSC(): Promise<Operation> {
    throw new Error(
      'executeSC is not supported by RustCore Wallet: raw bytecode cannot be reviewed by the user.',
    );
  }

  /** Not supported yet. */
  public async deploySC(): Promise<SmartContract> {
    throw new Error('deploySC is not supported by RustCore Wallet.');
  }

  private async send(
    operationName: operationType,
    method: string,
    params: Record<string, string>,
  ): Promise<Operation> {
    try {
      const { operationId } = (await this.rustcore.request(method, params)) as {
        operationId: string;
      };
      return new Operation(this, operationId);
    } catch (error) {
      throw rustCoreErrorHandler(operationName, error);
    }
  }

  // ---------------------------------------------------------------- reads

  public async balance(final = false): Promise<bigint> {
    const [{ balance }] = await this.balanceOf([this.address], final);
    return balance;
  }

  public async balanceOf(
    addresses: string[],
    final?: boolean,
  ): Promise<{ address: string; balance: bigint }[]> {
    const client = await this.getClient();
    return client.balanceOf(addresses, final);
  }

  public async readSC(params: ReadSCParams): Promise<ReadSCData> {
    const client = await this.getClient();
    return client.readSC({ ...params, caller: params.caller ?? this.address });
  }

  public async executeSCReadOnly(
    params: ExecuteSCReadOnlyParams,
  ): Promise<ExecuteSCReadOnlyResult> {
    const client = await this.getClient();
    return client.executeSCReadOnly(params);
  }

  public async getOperationStatus(opId: string): Promise<OperationStatus> {
    const client = await this.getClient();
    return client.getOperationStatus(opId);
  }

  public async getEvents(filter: EventFilter): Promise<rpcTypes.OutputEvents> {
    const client = await this.getClient();
    return client.getEvents(filter);
  }

  public async getNodeStatus(): Promise<NodeStatusInfo> {
    const client = await this.getClient();
    return client.getNodeStatus();
  }

  public async getStorageKeys(
    address: string,
    filter: Uint8Array | string = new Uint8Array(),
    final = true,
  ): Promise<Uint8Array[]> {
    const client = await this.getClient();
    return client.getStorageKeys(address, filter, final);
  }

  public async readStorage(
    address: string,
    keys: Uint8Array[] | string[],
    final = true,
  ): Promise<(Uint8Array | null)[]> {
    const client = await this.getClient();
    return client.readStorage(address, keys, final);
  }
}
