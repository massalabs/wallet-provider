import { providers } from '@massalabs/wallet-provider';

const availableProviders = await providers();
const massaStationProvider = availableProviders.find(
  (p) => p.name() === 'MASSASTATION',
);

if (!massaStationProvider) throw new Error('Massa Station provider not found');

const networkUrls = await massaStationProvider.getNodesUrls();

console.log('Network Urls:', networkUrls);
