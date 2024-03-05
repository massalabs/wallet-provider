import { EAccountDeletionResponse } from '@massalabs/wallet-provider';

import { getMassaStationProvider } from '../utils/provider-utils';

it('attempt to delete a non existing address', async () => {
  const massaStationProvider = await getMassaStationProvider();

  const resp = await massaStationProvider.deleteAccount('non-existing-address');

  expect(resp).toStrictEqual({
    response: EAccountDeletionResponse.ERROR,
  });
});
