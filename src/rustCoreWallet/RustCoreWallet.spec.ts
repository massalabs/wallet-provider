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
import { RustCoreSession } from './session';
import { RustCoreEvent, RustCoreInjected } from './types';

const ADDRESS = 'AU12K8ag8RQEBhFLtT6ixoMvv4ZsG2DNzKq3tbB1vssWM3LMZYskz';
const SECOND = 'AU1wN8rn4SkwYSTDF3dHFY4U28KtsqKL1NnEjDZhHnHEy6cEQm53';

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

  it('returns every account shared with a connected site, the one in use first', async () => {
    const { rustcore, request } = fakeRustCore({
      connected: true,
      accounts: { addresses: [ADDRESS, SECOND] },
    });
    const accounts = await new RustCoreWallet(rustcore).accounts();

    expect(accounts.map((a) => a.address)).toEqual([ADDRESS, SECOND]);
    expect(request).not.toHaveBeenCalledWith('account');
    expect(request).not.toHaveBeenCalledWith('connect');
  });

  it('with an older wallet, returns its one shared account', async () => {
    const { rustcore, request } = fakeRustCore({
      connected: true,
      account: { address: ADDRESS },
    });
    const accounts = await new RustCoreWallet(rustcore).accounts();

    expect(accounts.map((a) => a.address)).toEqual([ADDRESS]);
    // `accounts` is unknown before 1.6.0 (4200): asked, then `account`
    expect(request.mock.calls.map(([method]) => method)).toEqual([
      'connected',
      'accounts',
      'account',
    ]);
  });

  it('returns every account the user shared when connecting', async () => {
    const { rustcore, request } = fakeRustCore({
      connected: false,
      connect: { address: ADDRESS, addresses: [ADDRESS, SECOND] },
      accounts: { addresses: [ADDRESS, SECOND] },
    });
    const accounts = await new RustCoreWallet(rustcore).accounts();

    expect(accounts.map((a) => a.address)).toEqual([ADDRESS, SECOND]);
    // `accounts` right after connecting: the wallet then lets the site follow
    // the account the user switches to
    expect(request.mock.calls.map(([method]) => method)).toEqual([
      'connected',
      'connect',
      'accounts',
    ]);
  });

  it('keeps the accounts of the connection if listing them fails', async () => {
    const { rustcore } = fakeRustCore({
      connect: { address: ADDRESS, addresses: [ADDRESS, SECOND] },
      accounts: () => {
        throw rustCoreError(-32603, 'internal');
      },
    });
    expect(await new RustCoreWallet(rustcore).connect()).toBe(true);
  });

  it('with an older wallet, does not ask for accounts after connecting', async () => {
    const { rustcore, request } = fakeRustCore({
      connected: false,
      connect: { address: ADDRESS },
    });
    const accounts = await new RustCoreWallet(rustcore).accounts();

    expect(accounts.map((a) => a.address)).toEqual([ADDRESS]);
    expect(request).not.toHaveBeenCalledWith('accounts');
  });

  it('refuses a malformed list of accounts', async () => {
    const { rustcore } = fakeRustCore({
      connected: true,
      accounts: { addresses: [] },
    });
    await expect(new RustCoreWallet(rustcore).accounts()).rejects.toThrow(
      'RustCore Wallet returned invalid accounts.',
    );
  });

  it('asks to connect first when the site is not connected', async () => {
    const { rustcore, request } = fakeRustCore({
      connected: false,
      connect: { address: ADDRESS },
      account: { address: ADDRESS },
    });
    const [account] = await new RustCoreWallet(rustcore).accounts();

    // connect already answers the shared address
    expect(account.address).toBe(ADDRESS);
    expect(request.mock.calls.map(([method]) => method)).toEqual([
      'connected',
      'connect',
    ]);
  });

  it('sends a single connect for concurrent calls', async () => {
    let isConnected = false;
    let approve: () => void = () => undefined;
    let pending = false;
    const { rustcore, request } = fakeRustCore({
      connected: () => isConnected,
      // like the extension: a second connect while one waits is Busy
      connect: () => {
        if (pending) throw rustCoreError(4900, 'busy');
        pending = true;
        return new Promise((resolve) => {
          approve = () => {
            isConnected = true;
            resolve({ address: ADDRESS });
          };
        });
      },
      network: BUILDNET,
    });
    const wallet = new RustCoreWallet(rustcore);

    const both = Promise.all([wallet.accounts(), wallet.networkInfos()]);
    await new Promise((resolve) => setTimeout(resolve, 0));
    approve();
    const [[account], network] = await both;

    expect(account.address).toBe(ADDRESS);
    expect(network.name).toBe('buildnet');
    expect(request.mock.calls.filter(([m]) => m === 'connect')).toHaveLength(1);
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
    emit('networkChanged', { name: 'buildnet' }); // malformed: ignored
    observer.unsubscribe();
    emit('networkChanged', BUILDNET);

    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback.mock.calls[0][0]).toMatchObject({
      name: 'buildnet',
      chainId: 77658366n,
      minimalFee: 10000000n,
    });
  });

  it('listens to window.rustcore once however many wallets are created', () => {
    const { rustcore } = fakeRustCore();
    const on = jest.spyOn(rustcore, 'on');

    new RustCoreWallet(rustcore);
    new RustCoreWallet(rustcore);

    expect(on).toHaveBeenCalledTimes(2); // networkChanged and disconnect
  });

  it('tells when the user disconnects the site', () => {
    const { rustcore, emit } = fakeRustCore();
    const callback = jest.fn();
    const observer = new RustCoreWallet(rustcore).listenDisconnect(callback);

    emit('disconnect');
    observer.unsubscribe();
    emit('disconnect');

    expect(callback).toHaveBeenCalledTimes(1);
  });
});

const OPERATION_ID = 'O12Fbo1QjsTpLbbLoyQQyjGdYRSvL8FCh5nuRgTNmXaA4ToZy1RB';
const CONTRACT = 'AS12FW5Rs5YN2zdpEnqwj4iHUUPt9R4Eqjq2qtpJFNKW3mn33RuLU';
const OTHER = 'AU126s93ZxbT4QUJcZYqsAxyMc3wv8nkHJYKYCtgQyEnZ8VGRM99P';

const base64 = (bytes: Uint8Array) => Buffer.from(bytes).toString('base64');

function account(answers: Record<string, unknown> = {}) {
  const fake = fakeRustCore({ connected: true, network: BUILDNET, ...answers });
  const session = RustCoreSession.for(fake.rustcore);
  return { ...fake, account: new RustCoreAccount(ADDRESS, session) };
}

/** Requests other than the connection, accounts and network lookups. */
const operationRequests = (request: jest.Mock) =>
  request.mock.calls.filter(
    ([m]) => m !== 'connected' && m !== 'network' && m !== 'accounts',
  );

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

describe('RustCoreAccount with several accounts per site', () => {
  /** A 1.6.0+ wallet: answers `accounts`, takes `from`. */
  const severalAccounts = (answers: Record<string, unknown> = {}) =>
    account({ accounts: { addresses: [SECOND, ADDRESS] }, ...answers });

  it('names the account that signs, whichever one the site uses', async () => {
    const { account: acc, request } = severalAccounts({
      sign: { publicKey: 'P1key', signature: '1sig' },
      transfer: { operationId: OPERATION_ID },
      buyRolls: { operationId: OPERATION_ID },
      sellRolls: { operationId: OPERATION_ID },
      callSC: { operationId: OPERATION_ID },
    });

    await acc.sign(Uint8Array.from([1]));
    await acc.transfer(OTHER, 5n, { fee: 20_000_000n });
    await acc.buyRolls(1n);
    await acc.sellRolls(1n);
    await acc.callSC({ target: CONTRACT, func: 'f' });

    expect(operationRequests(request)).toEqual([
      ['sign', { data: base64(Uint8Array.from([1])), from: ADDRESS }],
      ['transfer', { to: OTHER, amount: '5', fee: '20000000', from: ADDRESS }],
      ['buyRolls', { rolls: '1', from: ADDRESS }],
      ['sellRolls', { rolls: '1', from: ADDRESS }],
      [
        'callSC',
        {
          target: CONTRACT,
          func: 'f',
          parameter: '',
          coins: '0',
          from: ADDRESS,
        },
      ],
    ]);
    // asked once for the page's life
    expect(request.mock.calls.filter(([m]) => m === 'accounts')).toHaveLength(
      1,
    );
  });

  it('knows from the connection that the wallet takes `from`', async () => {
    let isConnected = false;
    const { rustcore, request } = fakeRustCore({
      connected: () => isConnected,
      connect: () => {
        isConnected = true;
        return { address: SECOND, addresses: [SECOND, ADDRESS] };
      },
      accounts: { addresses: [SECOND, ADDRESS] },
      network: BUILDNET,
      transfer: { operationId: OPERATION_ID },
    });
    const [, second] = await new RustCoreWallet(rustcore).accounts();

    await second.transfer(OTHER, 1n);

    // asked once, right after connecting — not again before signing
    expect(request.mock.calls.filter(([m]) => m === 'accounts')).toHaveLength(
      1,
    );
    expect(request).toHaveBeenCalledWith('transfer', {
      to: OTHER,
      amount: '1',
      from: ADDRESS,
    });
  });

  it('with an older wallet, sends no `from`, which it would refuse', async () => {
    const { account: acc, request } = account({
      transfer: { operationId: OPERATION_ID },
    });

    await acc.transfer(OTHER, 1n);
    await acc.transfer(OTHER, 2n);

    expect(operationRequests(request)).toEqual([
      ['transfer', { to: OTHER, amount: '1' }],
      ['transfer', { to: OTHER, amount: '2' }],
    ]);
    expect(request.mock.calls.filter(([m]) => m === 'accounts')).toHaveLength(
      1,
    );
  });

  it('asks again once the site is connected if it could not tell before', async () => {
    let isConnected = false;
    const signed = { publicKey: 'P1key', signature: '1sig' };
    const { account: acc, request } = account({
      // like the extension: 4100 for a site that isn't connected
      accounts: () => {
        if (!isConnected) throw rustCoreError(4100, 'Connect first');
        return { addresses: [ADDRESS] };
      },
      sign: () => {
        if (!isConnected) throw rustCoreError(4100, 'Connect first');
        return signed;
      },
    });

    await expect(acc.sign('hi')).rejects.toMatchObject({ code: 4100 });
    isConnected = true;
    await acc.sign('hi');

    expect(request).toHaveBeenLastCalledWith('sign', {
      data: Buffer.from('hi', 'utf8').toString('base64'),
      from: ADDRESS,
    });
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

    const [first, second] = operationRequests(request);
    expect(first).toEqual([
      'callSC',
      {
        target: CONTRACT,
        func: 'transfer',
        parameter: base64(args.serialize()),
        coins: '0',
      },
    ]);
    expect(second).toEqual([
      'callSC',
      {
        target: CONTRACT,
        func: 'deposit',
        parameter: base64(Uint8Array.from([1, 2])),
        coins: '100000000',
        fee: '20000000',
        maxGas: '3000000',
      },
    ]);
  });

  it('forwards the fee of transfers and rolls', async () => {
    const { account: acc, request } = account({
      transfer: { operationId: OPERATION_ID },
      buyRolls: { operationId: OPERATION_ID },
      sellRolls: { operationId: OPERATION_ID },
    });

    await acc.transfer(OTHER, 5n, { fee: 20_000_000n });
    await acc.buyRolls(1n, { fee: 30_000_000n });
    await acc.sellRolls(1n, { fee: undefined });

    expect(operationRequests(request)).toEqual([
      ['transfer', { to: OTHER, amount: '5', fee: '20000000' }],
      ['buyRolls', { rolls: '1', fee: '30000000' }],
      ['sellRolls', { rolls: '1' }],
    ]);
  });

  it('refuses periodToLive, which the wallet sets itself, instead of ignoring it', async () => {
    const { account: acc, request } = account({
      transfer: { operationId: OPERATION_ID },
      callSC: { operationId: OPERATION_ID },
    });

    await expect(
      acc.transfer(OTHER, 1n, { fee: 1n, periodToLive: 5 }),
    ).rejects.toThrow(/transfer: RustCore Wallet sets periodToLive itself/);
    await expect(
      acc.callSC({ target: CONTRACT, func: 'f', periodToLive: 5 }),
    ).rejects.toThrow(/callSC: RustCore Wallet sets periodToLive itself/);
    expect(operationRequests(request)).toEqual([]);
  });

  it('follows an operation on the network the wallet answers with it', async () => {
    const answeredUrl = 'https://answered.example/api/v2';
    const cachedUrl = 'https://cached.example/api/v2';
    const clients = {
      [answeredUrl]: { getOperationStatus: jest.fn(async () => 0) },
      [cachedUrl]: { getOperationStatus: jest.fn(async () => 0) },
    };
    jest
      .spyOn(JsonRpcPublicProvider, 'fromRPCUrl')
      .mockImplementation(
        (url) => clients[url] as unknown as JsonRpcPublicProvider,
      );
    const { account: acc } = account({
      network: { ...BUILDNET, url: cachedUrl },
      // networkChanged may still be on its way: the answer says where it went
      transfer: {
        operationId: OPERATION_ID,
        network: { ...BUILDNET, url: answeredUrl },
      },
    });

    await (await acc.transfer(OTHER, 1n)).getStatus();

    expect(clients[answeredUrl].getOperationStatus).toHaveBeenCalled();
    expect(clients[cachedUrl].getOperationStatus).not.toHaveBeenCalled();
  });

  it('throws a clear error when the wallet returns no operation id', async () => {
    const { account: acc } = account({ transfer: { id: OPERATION_ID } });
    await expect(acc.transfer(OTHER, 1n)).rejects.toThrow(
      'RustCore Wallet returned no operation id for transfer.',
    );
  });

  it('with an older wallet, follows an operation on the network it was sent on', async () => {
    const mainnetUrl = 'https://sent-on.example/api/v2';
    const buildnetUrl = 'https://switched-to.example/api/v2';
    const clients = {
      [mainnetUrl]: { getOperationStatus: jest.fn(async () => 0) },
      [buildnetUrl]: { getOperationStatus: jest.fn(async () => 0) },
    };
    jest
      .spyOn(JsonRpcPublicProvider, 'fromRPCUrl')
      .mockImplementation(
        (url) => clients[url] as unknown as JsonRpcPublicProvider,
      );
    const { account: acc, emit } = account({
      network: { ...BUILDNET, url: mainnetUrl },
      transfer: { operationId: OPERATION_ID },
    });

    const operation = await acc.transfer(OTHER, 1n);
    emit('networkChanged', { ...BUILDNET, url: buildnetUrl });
    await operation.getStatus();

    expect(clients[mainnetUrl].getOperationStatus).toHaveBeenCalledWith(
      OPERATION_ID,
    );
    expect(clients[buildnetUrl].getOperationStatus).not.toHaveBeenCalled();
  });

  it('with an older wallet, follows a switch announced before the answer', async () => {
    const beforeUrl = 'https://before-prompt.example/api/v2';
    const afterUrl = 'https://during-prompt.example/api/v2';
    const clients = {
      [beforeUrl]: { getOperationStatus: jest.fn(async () => 0) },
      [afterUrl]: { getOperationStatus: jest.fn(async () => 0) },
    };
    jest
      .spyOn(JsonRpcPublicProvider, 'fromRPCUrl')
      .mockImplementation(
        (url) => clients[url] as unknown as JsonRpcPublicProvider,
      );
    let switchNetwork = () => undefined as void;
    const { account: acc, emit } = account({
      network: { ...BUILDNET, url: beforeUrl },
      // the extension sends networkChanged before answering
      transfer: () => {
        switchNetwork();
        return { operationId: OPERATION_ID };
      },
    });
    switchNetwork = () =>
      emit('networkChanged', { ...BUILDNET, url: afterUrl });

    await (await acc.transfer(OTHER, 1n)).getStatus();

    expect(clients[afterUrl].getOperationStatus).toHaveBeenCalled();
    expect(clients[beforeUrl].getOperationStatus).not.toHaveBeenCalled();
  });

  it('asks to connect again before an operation once disconnected', async () => {
    let isConnected = true;
    const {
      account: acc,
      request,
      emit,
    } = account({
      connected: () => isConnected,
      connect: () => {
        throw rustCoreError(4001);
      },
      transfer: { operationId: OPERATION_ID },
    });

    isConnected = false;
    emit('disconnect');
    await expect(acc.transfer(OTHER, 1n)).rejects.toThrow(UserRejectionError);
    expect(request).not.toHaveBeenCalledWith('transfer', expect.anything());
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
    const {
      account: acc,
      request,
      emit,
    } = account({
      network: { ...BUILDNET, url: mainnetUrl },
    });

    expect(await acc.balance(true)).toBe(42n);
    expect(clients[mainnetUrl].balanceOf).toHaveBeenCalledWith([ADDRESS], true);

    // the user switches network in the wallet
    emit('networkChanged', { ...BUILDNET, url: buildnetUrl });
    expect(await acc.getOperationStatus(OPERATION_ID)).toBe(
      OperationStatus.Success,
    );
    expect(clients[buildnetUrl].getOperationStatus).toHaveBeenCalled();

    emit('networkChanged', { ...BUILDNET, url: mainnetUrl });
    await acc.balanceOf([OTHER]);
    expect(clients[mainnetUrl].balanceOf).toHaveBeenCalledTimes(2);

    // one client per node, the network asked once, no signature for reads
    expect(fromRPCUrl).toHaveBeenCalledTimes(2);
    expect(request.mock.calls.map(([method]) => method)).toEqual(['network']);
  });

  it('never prompts for reads once the site was disconnected', async () => {
    const client = stubClient();
    jest
      .spyOn(JsonRpcPublicProvider, 'fromRPCUrl')
      .mockReturnValue(client as unknown as JsonRpcPublicProvider);
    let isConnected = true;
    const {
      account: acc,
      request,
      emit,
    } = account({
      // like the extension: 4100 for a site that isn't connected
      network: () => {
        if (!isConnected) throw rustCoreError(4100, 'Connect first');
        return { ...BUILDNET, url: 'https://polling.example/api/v2' };
      },
    });

    await acc.balance();
    isConnected = false;
    emit('disconnect');
    // a dApp polling its balance
    await expect(acc.balance()).rejects.toThrow(/not connected/);
    await expect(acc.balance()).rejects.toThrow(/not connected/);

    isConnected = true;
    await acc.balance();
    expect(request).not.toHaveBeenCalledWith('connect');
    expect(client.balanceOf).toHaveBeenCalledTimes(2);
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
