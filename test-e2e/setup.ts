import { MassaStationWallet } from '../src';
import { getMassaStationWallet } from './massaStation/utils/utils';
import { TextEncoder, TextDecoder } from 'util';

Object.assign(global, { TextDecoder, TextEncoder });

export let msWallet: MassaStationWallet;

jest.setTimeout(120_000);

beforeAll(async () => {
  msWallet = await getMassaStationWallet();
});
