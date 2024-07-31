import { getMassaStationWallet } from '../utils/provider-utils';

it('attempt to delete a non existing address', async () => {
  const massaStationWallet = await getMassaStationWallet();
  expect(async () => {
    await massaStationWallet.deleteAccount('non-existing-address');
  }).rejects.toThrow('Account not found');
});
