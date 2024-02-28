import { providers } from '@massalabs/wallet-provider';

it('should get network url', async () => {
  const availableProviders = await providers();
  const massaStationProvider = availableProviders.find(
    (p) => p.name() === 'MASSASTATION',
  );

  if (!massaStationProvider)
    throw new Error('Massa Station provider not found');

  const networkUrls = await massaStationProvider.getNodesUrls();

  expect(networkUrls.length).toBeGreaterThan(0);
  expect(networkUrls[0]).toContain('massa.net');

  console.log('Network Urls:', networkUrls);
});
