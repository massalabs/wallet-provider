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
import { errorHandler } from '../errors/utils/errorHandler';
import { operationType } from '../utils/constants';
import { uint8ArrayToBase64 } from '../utils/base64';
import { RustCoreSession } from './session';
import { toNetwork } from './utils';

const jsonClients = new Map<string, JsonRpcPublicProvider>();

/**
 * An account the user shared with this site through RustCore Wallet.
 *
 * @remarks
 * Signatures go to the extension, where the user approves each of them.
 * Reads (balances, readSC, events, storage…) need no key: they go straight to
 * a public node of the wallet's current network.
 *
 * The wallet sets the fee of transfers and rolls, and the expiry of every
 * operation: setting them here throws instead of being ignored.
 */
export class RustCoreAccount implements Provider {
  public constructor(
    public readonly address: string,
    private readonly session: RustCoreSession,
  ) {}

  get accountName(): string {
    return this.address;
  }

  get providerName(): string {
    return WalletName.RustCore;
  }

  public async networkInfos(): Promise<Network> {
    return toNetwork(await this.session.currentNetwork());
  }

  // The user can switch network in the wallet at any time: follow the current
  // one, so a client for another network is never reused.
  private async getClient(): Promise<JsonRpcPublicProvider> {
    const { url } = await this.session.currentNetwork();
    return clientFor(url);
  }

  // ---------------------------------------------------------------- signing

  public async sign(data: Uint8Array | string): Promise<SignedData> {
    const bytes = typeof data === 'string' ? strToBytes(data) : data;
    try {
      return (await this.session.rustcore.request('sign', {
        data: uint8ArrayToBase64(bytes),
      })) as SignedData;
    } catch (error) {
      throw errorHandler(operationType.Sign, error);
    }
  }

  public async transfer(
    to: Address | string,
    amount: bigint,
    opts?: OperationOptions,
  ): Promise<Operation> {
    refuseOptions('transfer', opts);
    return this.send(operationType.SendTransaction, 'transfer', {
      to: to.toString(),
      amount: amount.toString(),
    });
  }

  public async buyRolls(
    amount: bigint,
    opts?: OperationOptions,
  ): Promise<Operation> {
    refuseOptions('buyRolls', opts);
    return this.send(operationType.BuyRolls, 'buyRolls', {
      rolls: amount.toString(),
    });
  }

  public async sellRolls(
    amount: bigint,
    opts?: OperationOptions,
  ): Promise<Operation> {
    refuseOptions('sellRolls', opts);
    return this.send(operationType.SellRolls, 'sellRolls', {
      rolls: amount.toString(),
    });
  }

  /**
   * Calls a smart contract. The wallet simulates the call and shows it to the
   * user before signing; `fee` is raised to the network's minimum if lower.
   */
  public async callSC(params: CallSCParams): Promise<Operation> {
    refuseOptions('callSC', { periodToLive: params.periodToLive });
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
    // The operation is sent on the wallet's current network: follow its status
    // on that network's node even if the user switches network afterwards.
    const { url } = await this.session.currentNetwork();
    let result: unknown;
    try {
      result = await this.session.rustcore.request(method, params);
    } catch (error) {
      throw errorHandler(operationName, error);
    }
    const operationId = (result as { operationId?: unknown })?.operationId;
    if (typeof operationId !== 'string') {
      throw new Error(
        `RustCore Wallet returned no operation id for ${method}.`,
      );
    }
    return new Operation(clientFor(url), operationId);
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

// one public client per node url, created on first use
function clientFor(url: string): JsonRpcPublicProvider {
  let client = jsonClients.get(url);
  if (!client) {
    client = JsonRpcPublicProvider.fromRPCUrl(url) as JsonRpcPublicProvider;
    jsonClients.set(url, client);
  }
  return client;
}

/** Throws for the options the wallet sets itself, rather than ignoring them. */
function refuseOptions(method: string, options: OperationOptions = {}): void {
  const given = Object.entries(options)
    .filter(([, value]) => value !== undefined)
    .map(([name]) => name);
  if (given.length) {
    throw new Error(
      `${method}: RustCore Wallet sets ${given.join(' and ')} itself; leave ${given.length > 1 ? 'them' : 'it'} unset.`,
    );
  }
}
