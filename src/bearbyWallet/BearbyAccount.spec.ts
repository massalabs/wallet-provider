import { strToBytes } from '@massalabs/massa-web3';
import { BearbyAccount } from './BearbyAccount';

const mockGetAddresses = jest.fn();

jest.mock('@hicaru/bearby.js', () => ({
  web3: {
    wallet: { network: Promise.resolve({ net: 'buildnet' }) },
    massa: {
      getNodesStatus: jest.fn().mockResolvedValue({
        result: { chain_id: 77658366, minimal_fees: '0.01' },
      }),
      getAddresses: (...args: unknown[]) => mockGetAddresses(...args),
    },
  },
}));

const ADDRESS = 'AS12ZFbbwEckKkkyGYsdJA5CbSZBWxZJoQvZth2qCm1EoseS97FM7';
const PAGE_SIZE = 500;

type KeysRequest = {
  address: string;
  is_final: boolean;
  prefix: number[];
  start_key: number[] | null;
  inclusive_start_key: boolean | null;
  count: number | null;
};

// keys [prefix, i >> 8, i & 0xff] for i in [from, to), in ascending byte order
const keyRange = (prefix: number[], from: number, to: number): number[][] =>
  Array.from({ length: to - from }, (_, i) => [
    ...prefix,
    (from + i) >> 8,
    (from + i) & 0xff,
  ]);

describe('BearbyAccount.getStorageKeys', () => {
  let getAddressesKeys: jest.Mock;

  beforeEach(() => {
    mockGetAddresses.mockReset();
    getAddressesKeys = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // The client is cached at module level: load fresh modules for each test,
  // and stub the node in that same module registry. The provider and its
  // pagination are the real ones.
  const newAccount = (): BearbyAccount => {
    let account: BearbyAccount | undefined;
    jest.isolateModules(() => {
      /* eslint-disable @typescript-eslint/no-var-requires */
      const web3 = require('@massalabs/massa-web3');
      const { BearbyAccount: FreshAccount } = require('./BearbyAccount');
      /* eslint-enable @typescript-eslint/no-var-requires */
      const provider = web3.JsonRpcPublicProvider.buildnet();
      provider.client.connector.get_addresses_keys = getAddressesKeys;
      jest
        .spyOn(web3.JsonRpcPublicProvider, 'buildnet')
        .mockReturnValue(provider);
      account = new FreshAccount('AU1test');
    });
    if (!account) throw new Error('BearbyAccount was not loaded');
    return account;
  };

  it('pages through get_addresses_datastore_keys past the node cap', async () => {
    const prefix = [7];
    const allKeys = keyRange(prefix, 0, 2 * PAGE_SIZE + 3);
    getAddressesKeys.mockImplementation(async ([req]: KeysRequest[]) => {
      const startKey = req.start_key?.toString();
      const start = startKey
        ? allKeys.findIndex((k) => k.toString() === startKey) + 1
        : 0;
      return [
        {
          address: req.address,
          is_final: req.is_final,
          keys: allKeys.slice(start, start + (req.count ?? PAGE_SIZE)),
        },
      ];
    });

    const keys = await newAccount().getStorageKeys(
      ADDRESS,
      Uint8Array.from(prefix),
    );

    expect(keys).toEqual(allKeys.map((k) => Uint8Array.from(k)));
    expect(getAddressesKeys).toHaveBeenCalledTimes(3);
    expect(mockGetAddresses).not.toHaveBeenCalled();

    const requests = getAddressesKeys.mock.calls.map(
      ([[req]]: [KeysRequest[]]) => req,
    );
    for (const req of requests) {
      expect(req).toMatchObject({
        address: ADDRESS,
        is_final: true,
        prefix,
        count: PAGE_SIZE,
      });
    }
    // each page resumes right after the last key of the previous one
    expect(requests[0].start_key).toBeNull();
    expect(requests[1].start_key).toEqual(allKeys[PAGE_SIZE - 1]);
    expect(requests[1].inclusive_start_key).toBe(false);
    expect(requests[2].start_key).toEqual(allKeys[2 * PAGE_SIZE - 1]);
    expect(requests[2].inclusive_start_key).toBe(false);
  });

  it('sends a string filter as the byte prefix of the query', async () => {
    getAddressesKeys.mockResolvedValue([
      { address: ADDRESS, is_final: true, keys: [] },
    ]);

    await newAccount().getStorageKeys(ADDRESS, 'BALANCE');

    const [[req]] = getAddressesKeys.mock.calls[0];
    expect(req.prefix).toEqual(Array.from(strToBytes('BALANCE')));
  });

  it('queries candidate keys when final is false', async () => {
    getAddressesKeys.mockResolvedValue([
      { address: ADDRESS, is_final: false, keys: [[1, 2]] },
    ]);

    const keys = await newAccount().getStorageKeys(
      ADDRESS,
      new Uint8Array(),
      false,
    );

    expect(keys).toEqual([Uint8Array.from([1, 2])]);
    const [[req]] = getAddressesKeys.mock.calls[0];
    expect(req.is_final).toBe(false);
    expect(req.prefix).toEqual([]);
  });
});
