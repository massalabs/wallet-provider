import { MassaStationWallet } from '../src';
import { getMassaStationWallet } from './massaStation/utils/utils';

export let msWallet: MassaStationWallet;

jest.setTimeout(120_000);

beforeAll(async () => {
  msWallet = await getMassaStationWallet();
});
