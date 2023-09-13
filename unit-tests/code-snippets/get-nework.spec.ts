import { providers } from '@massalabs/wallet-provider';

const networks = ['mainnet', 'testnet', 'buildnet', 'labnet'];

// Test get Network
it('should get network', async () => {
  const availableProviders = await providers();
  const massaStationProvider = availableProviders.find(
    (p) => p.name() === 'MASSASTATION',
  );

  if (!massaStationProvider)
    throw new Error('Massa Station provider not found');

  const network = await massaStationProvider.getNetwork();

  expect(networks).toContain(network);

  console.log('Network Name:', network);
});
