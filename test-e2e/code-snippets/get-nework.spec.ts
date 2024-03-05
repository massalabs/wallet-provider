import { providers } from '@massalabs/wallet-provider';

it('should get network', async () => {
  const availableProviders = await providers();
  const massaStationProvider = availableProviders.find(
    (p) => p.name() === 'MASSASTATION',
  );

  if (!massaStationProvider)
    throw new Error('Massa Station provider not found');

  const network = await massaStationProvider.getNetwork();

  expect(['mainnet', 'testnet', 'buildnet', 'labnet']).toContain(network);

  console.log('Network Name:', network);
});
