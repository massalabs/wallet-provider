import {
  Address,
  Args,
  JsonRpcPublicProvider,
  Operation,
  OperationStatus,
} from '@massalabs/massa-web3';
import { UserRejectionError } from '../errors';
import { WalletName } from '../wallet';
import { supportedWallets } from '../walletsManager/walletList';
import { RustCoreAccount } from './RustCoreAccount';
import { RustCoreWallet } from './RustCoreWallet';
import { RustCoreEvent, RustCoreInjected } from './types';

const ADDRESS = 'AU12K8ag8RQEBhFLtT6ixoMvv4ZsG2DNzKq3tbB1vssWM3LMZYskz';

const BUILDNET = {
  name: 'buildnet',
  chainId: '77658366',
  url: 'https://buildnet.massa.net/api/v2',
  minimalFee: '10000000',
};

/** An error as window.rustcore rejects it. */
const rustCoreError = (code: number, message = 'error') =>
  Object.assign(new Error(message), { name: 'RustCoreError', code });

/**
 * A stand-in for the extension's window.rustcore: answers each method with
 * `answers[method]` (a value, or a function of the params), and lets tests
 * emit events.
 */
function fakeRustCore(
  answers: Record<string, unknown | ((params: unknown) => unknown)> = {},
) {
  const listeners = new Map<RustCoreEvent, Set<(data: unknown) => void>>();
  const request = jest.fn(async (method: string, params?: unknown) => {
    if (!(method in answers)) throw rustCoreError(4200, `Unknown: ${method}`);
    const answer = answers[method];
    return typeof answer === 'function' ? answer(params) : answer;
  });
  const rustcore: RustCoreInjected = {
    isRustCore: true,
    version: '1',
    request,
    on(event, callback) {
      const set = listeners.get(event) ?? new Set();
      set.add(callback);
      listeners.set(event, set);
      return () => set.delete(callback);
    },
  };
  const emit = (event: RustCoreEvent, data?: unknown) =>
    listeners.get(event)?.forEach((callback) => callback(data));
  return { rustcore, request, emit };
}

// The wallet list also loads the other wallets; bearby.js ships as ESM only.
jest.mock('@hicaru/bearby.js', () => ({ web3: {} }));

const globalWithWindow = globalThis as { window?: unknown };

afterEach(() => {
  delete globalWithWindow.window;
  jest.restoreAllMocks();
});

describe('RustCoreWallet detection', () => {
  it('is one of the supported wallets', () => {
    expect(supportedWallets).toContain(RustCoreWallet);
  });

  it('is not created when window.rustcore is missing', async () => {
    expect(await RustCoreWallet.createIfInstalled()).toBeNull();
    globalWithWindow.window = {};
    expect(await RustCoreWallet.createIfInstalled()).toBeNull();
  });

  it('is not created for an object that is not RustCore', async () => {
    globalWithWindow.window = { rustcore: { request: jest.fn() } };
    expect(await RustCoreWallet.createIfInstalled()).toBeNull();
  });

  it('is created when the extension injected window.rustcore', async () => {
    globalWithWindow.window = { rustcore: fakeRustCore().rustcore };
    const wallet = await RustCoreWallet.createIfInstalled();
    expect(wallet).toBeInstanceOf(RustCoreWallet);
    expect(wallet?.name()).toBe(WalletName.RustCore);
    expect(wallet?.enabled()).toBe(true);
  });
});

describe('RustCoreWallet connection', () => {
  it('returns the shared account of a connected site without asking again', async () => {
    const { rustcore, request } = fakeRustCore({
      connected: true,
      account: { address: ADDRESS },
    });
    const accounts = await new RustCoreWallet(rustcore).accounts();

    expect(accounts).toHaveLength(1);
    expect(accounts[0]).toBeInstanceOf(RustCoreAccount);
    expect(accounts[0].address).toBe(ADDRESS);
    expect(accounts[0].providerName).toBe(WalletName.RustCore);
    expect(request).not.toHaveBeenCalledWith('connect');
  });

  it('asks to connect first when the site is not connected', async () => {
    const { rustcore, request } = fakeRustCore({
      connected: false,
      connect: { address: ADDRESS },
      account: { address: ADDRESS },
    });
    const [account] = await new RustCoreWallet(rustcore).accounts();

    expect(account.address).toBe(ADDRESS);
    expect(request.mock.calls.map(([method]) => method)).toEqual([
      'connected',
      'connect',
      'account',
    ]);
  });

  it('throws a UserRejectionError when the user declines to connect', async () => {
    const { rustcore, request } = fakeRustCore({
      connected: false,
      connect: () => {
        throw rustCoreError(4001, 'Rejected by the user');
      },
    });
    await expect(new RustCoreWallet(rustcore).accounts()).rejects.toThrow(
      UserRejectionError,
    );
    expect(request).not.toHaveBeenCalledWith('account');
  });

  it('connect() answers false on rejection and rethrows other errors', async () => {
    const declined = fakeRustCore({
      connect: () => {
        throw rustCoreError(4001);
      },
    });
    expect(await new RustCoreWallet(declined.rustcore).connect()).toBe(false);

    const busy = fakeRustCore({
      connect: () => {
        throw rustCoreError(4900, 'busy');
      },
    });
    await expect(new RustCoreWallet(busy.rustcore).connect()).rejects.toThrow(
      'busy',
    );

    const ok = fakeRustCore({ connect: { address: ADDRESS } });
    expect(await new RustCoreWallet(ok.rustcore).connect()).toBe(true);
  });

  it('reports and ends the connection', async () => {
    const { rustcore, request } = fakeRustCore({
      connected: true,
      disconnect: true,
    });
    const wallet = new RustCoreWallet(rustcore);
    expect(await wallet.connected()).toBe(true);
    expect(await wallet.disconnect()).toBe(true);
    expect(request).toHaveBeenCalledWith('disconnect');
  });

  it('converts the network to massa-web3 types', async () => {
    const { rustcore } = fakeRustCore({ connected: true, network: BUILDNET });
    expect(await new RustCoreWallet(rustcore).networkInfos()).toEqual({
      name: 'buildnet',
      chainId: 77658366n,
      url: 'https://buildnet.massa.net/api/v2',
      minimalFee: 10000000n,
    });
  });

  it('refuses account management from websites', async () => {
    const { rustcore, request } = fakeRustCore();
    const wallet = new RustCoreWallet(rustcore);
    await expect(wallet.importAccount()).rejects.toThrow();
    await expect(wallet.deleteAccount()).rejects.toThrow();
    await expect(wallet.generateNewAccount()).rejects.toThrow();
    await expect(wallet.setRpcUrl()).rejects.toThrow();
    expect(request).not.toHaveBeenCalled();
  });
});

describe('RustCoreWallet events', () => {
  it('forwards account changes until unsubscribed', () => {
    const { rustcore, emit } = fakeRustCore();
    const callback = jest.fn();
    const observer = new RustCoreWallet(rustcore).listenAccountChanges(
      callback,
    );

    emit('accountChanged', { address: ADDRESS });
    emit('accountChanged', {}); // malformed: ignored
    observer.unsubscribe();
    emit('accountChanged', { address: 'AU1other' });

    expect(callback.mock.calls).toEqual([[ADDRESS]]);
  });

  it('forwards network changes as massa-web3 networks', () => {
    const { rustcore, emit } = fakeRustCore();
    const callback = jest.fn();
    const observer = new RustCoreWallet(rustcore).listenNetworkChanges(
      callback,
    );

    emit('networkChanged', BUILDNET);
    observer.unsubscribe();
    emit('networkChanged', BUILDNET);

    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback.mock.calls[0][0]).toMatchObject({
      name: 'buildnet',
      chainId: 77658366n,
      minimalFee: 10000000n,
    });
  });
});

const OPERATION_ID = 'O12Fbo1QjsTpLbbLoyQQyjGdYRSvL8FCh5nuRgTNmXaA4ToZy1RB';
const CONTRACT = 'AS12FW5Rs5YN2zdpEnqwj4iHUUPt9R4Eqjq2qtpJFNKW3mn33RuLU';
const OTHER = 'AU126s93ZxbT4QUJcZYqsAxyMc3wv8nkHJYKYCtgQyEnZ8VGRM99P';

const base64 = (bytes: Uint8Array) => Buffer.from(bytes).toString('base64');

function account(answers: Record<string, unknown> = {}) {
  const fake = fakeRustCore({ network: BUILDNET, ...answers });
  return { ...fake, account: new RustCoreAccount(ADDRESS, fake.rustcore) };
}

describe('RustCoreAccount signing', () => {
  it('signs text as its UTF-8 bytes, base64-encoded', async () => {
    const signed = { publicKey: 'P1key', signature: '1sig' };
    const { account: acc, request } = account({ sign: signed });

    expect(await acc.sign('Hello Massa')).toEqual(signed);
    expect(request).toHaveBeenCalledWith('sign', {
      data: Buffer.from('Hello Massa', 'utf8').toString('base64'),
    });
  });

  it('signs bytes as they are', async () => {
    const { account: acc, request } = account({
      sign: { publicKey: 'P1key', signature: '1sig' },
    });
    const data = Uint8Array.from([0xff, 0x00, 0x80]);

    await acc.sign(data);
    expect(request).toHaveBeenCalledWith('sign', { data: base64(data) });
  });

  it('turns a rejection by the user into a UserRejectionError', async () => {
    const { account: acc } = account({
      sign: () => {
        throw rustCoreError(4001, 'Rejected by the user');
      },
    });
    await expect(acc.sign('hi')).rejects.toThrow(UserRejectionError);
  });

  it('passes other wallet errors through', async () => {
    const busy = rustCoreError(
      4900,
      'Another request from this site is waiting',
    );
    const { account: acc } = account({
      transfer: () => {
        throw busy;
      },
    });
    await expect(acc.transfer(OTHER, 1n)).rejects.toBe(busy);
  });
});

describe('RustCoreAccount operations', () => {
  it('transfers MAS in smallest units and returns the operation', async () => {
    const { account: acc, request } = account({
      transfer: { operationId: OPERATION_ID },
    });

    const operation = await acc.transfer(
      Address.fromString(OTHER),
      1_500_000_000n,
    );

    expect(request).toHaveBeenCalledWith('transfer', {
      to: OTHER,
      amount: '1500000000',
    });
    expect(operation).toBeInstanceOf(Operation);
    expect(operation.id).toBe(OPERATION_ID);
  });

  it('buys and sells rolls', async () => {
    const { account: acc, request } = account({
      buyRolls: { operationId: OPERATION_ID },
      sellRolls: { operationId: OPERATION_ID },
    });

    await acc.buyRolls(2n);
    await acc.sellRolls(1n);

    expect(request).toHaveBeenCalledWith('buyRolls', { rolls: '2' });
    expect(request).toHaveBeenCalledWith('sellRolls', { rolls: '1' });
  });

  it('calls a contract with serialized args, sending only the options given', async () => {
    const { account: acc, request } = account({
      callSC: { operationId: OPERATION_ID },
    });
    const args = new Args().addString(OTHER).addU256(10n);

    await acc.callSC({ target: CONTRACT, func: 'transfer', parameter: args });
    await acc.callSC({
      target: CONTRACT,
      func: 'deposit',
      parameter: Uint8Array.from([1, 2]),
      coins: 100_000_000n,
      fee: 20_000_000n,
      maxGas: 3_000_000n,
    });

    expect(request).toHaveBeenNthCalledWith(1, 'callSC', {
      target: CONTRACT,
      func: 'transfer',
      parameter: base64(args.serialize()),
      coins: '0',
    });
    expect(request).toHaveBeenNthCalledWith(2, 'callSC', {
      target: CONTRACT,
      func: 'deposit',
      parameter: base64(Uint8Array.from([1, 2])),
      coins: '100000000',
      fee: '20000000',
      maxGas: '3000000',
    });
  });

  it('refuses raw bytecode and deployments', async () => {
    const { account: acc, request } = account();
    await expect(acc.executeSC()).rejects.toThrow(/not supported/);
    await expect(acc.deploySC()).rejects.toThrow(/not supported/);
    expect(request).not.toHaveBeenCalled();
  });
});

describe('RustCoreAccount reads', () => {
  function stubClient() {
    return {
      balanceOf: jest.fn(async (addresses: string[]) =>
        addresses.map((address) => ({ address, balance: 42n })),
      ),
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      readSC: jest.fn(async (_params: unknown) => ({
        value: new Uint8Array(),
        info: {},
      })),
      getOperationStatus: jest.fn(async () => OperationStatus.Success),
    };
  }

  it("reads from a public node of the wallet's current network", async () => {
    const mainnetUrl = 'https://mainnet.example/api/v2';
    const buildnetUrl = 'https://buildnet.example/api/v2';
    const clients = { [mainnetUrl]: stubClient(), [buildnetUrl]: stubClient() };
    const fromRPCUrl = jest
      .spyOn(JsonRpcPublicProvider, 'fromRPCUrl')
      .mockImplementation(
        (url) => clients[url] as unknown as JsonRpcPublicProvider,
      );
    let url = mainnetUrl;
    const { account: acc, request } = account({
      network: () => ({ ...BUILDNET, url }),
    });

    expect(await acc.balance(true)).toBe(42n);
    expect(clients[mainnetUrl].balanceOf).toHaveBeenCalledWith([ADDRESS], true);

    // the user switches network in the wallet
    url = buildnetUrl;
    expect(await acc.getOperationStatus(OPERATION_ID)).toBe(
      OperationStatus.Success,
    );
    expect(clients[buildnetUrl].getOperationStatus).toHaveBeenCalled();

    url = mainnetUrl;
    await acc.balanceOf([OTHER]);
    expect(clients[mainnetUrl].balanceOf).toHaveBeenCalledTimes(2);

    // one client per node, and no signature requested for reads
    expect(fromRPCUrl).toHaveBeenCalledTimes(2);
    expect(request.mock.calls.every(([method]) => method === 'network')).toBe(
      true,
    );
  });

  it('simulates calls as this account unless another caller is given', async () => {
    const client = stubClient();
    jest
      .spyOn(JsonRpcPublicProvider, 'fromRPCUrl')
      .mockReturnValue(client as unknown as JsonRpcPublicProvider);
    const { account: acc } = account({
      network: { ...BUILDNET, url: 'https://readsc.example/api/v2' },
    });

    await acc.readSC({ target: CONTRACT, func: 'balanceOf' });
    await acc.readSC({ target: CONTRACT, func: 'balanceOf', caller: OTHER });

    expect(client.readSC.mock.calls[0][0]).toMatchObject({ caller: ADDRESS });
    expect(client.readSC.mock.calls[1][0]).toMatchObject({ caller: OTHER });
  });
});
