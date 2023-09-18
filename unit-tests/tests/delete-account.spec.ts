import {
  providers,
  EAccountDeletionResponse,
} from '@massalabs/wallet-provider';

it('attempt to delete a non existing address', async () => {
  const availableProviders = await providers();
  const massaStationProvider = availableProviders.find(
    (p) => p.name() === 'MASSASTATION',
  );

  // stop the test if the provider is not available
  if (!massaStationProvider)
    throw new Error('Massa Station provider not found');

  const resp = await massaStationProvider.deleteAccount('non-existing-address');

  expect(resp).toStrictEqual({
    response: EAccountDeletionResponse.ERROR,
  });
});
