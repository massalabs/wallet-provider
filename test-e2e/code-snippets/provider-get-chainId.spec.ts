import { providers } from '@massalabs/wallet-provider';

it('should get network', async () => {
  const availableProviders = await providers();
  const massaStationProvider = availableProviders.find(
    (p) => p.name() === 'MASSASTATION',
  );

  if (!massaStationProvider)
    throw new Error('Massa Station provider not found');

  const chainId = await massaStationProvider.getChainId();

  expect([77658366n, 77658377n]).toContain(chainId);

  console.log('Network Name:', chainId);
});
