import { MassaStationWallet } from '../src';
import { getMassaStationWallet } from './massaStation/utils/utils';
import { TextEncoder, TextDecoder } from 'util';

Object.assign(global, { TextDecoder, TextEncoder });

export let msWallet: MassaStationWallet;

// Wallet YML is imported by CI MS Wallet
export const publicKey = 'P1xphUEkJfqnkpA9g2NTTkyTA1ojUrJ8K66ywR7PSfRjkvpr7ic';
export const accountName = 'wallet-provider-tests';

jest.setTimeout(120_000);

beforeAll(async () => {
  msWallet = await getMassaStationWallet();
});
