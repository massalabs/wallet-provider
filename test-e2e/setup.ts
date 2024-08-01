import { MassaStationWallet } from '../src';
import { getMassaStationWallet } from './massaStation/utils/utils';

export let msWallet: MassaStationWallet;

jest.setTimeout(30000); // in milliseconds

beforeAll(async () => {
  msWallet = await getMassaStationWallet();
});
