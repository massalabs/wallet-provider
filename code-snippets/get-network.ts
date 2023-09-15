import { providers } from '@massalabs/wallet-provider';

(async () => {
  const availableProviders = await providers();
  const massaStationProvider = availableProviders.find(
    (p) => p.name() === 'MASSASTATION',
  );

  // stop the test if the provider is not available
  if (!massaStationProvider)
    throw new Error('Massa Station provider not found');

  // Get current network
  const network = await massaStationProvider.getNetwork();

  // Print the network name
  console.log('Network Name:', network);
})();
