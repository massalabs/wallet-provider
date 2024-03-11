import { providers } from '@massalabs/wallet-provider';

const availableProviders = await providers();
const massaStationProvider = availableProviders.find(
  (p) => p.name() === 'MASSASTATION',
);

if (!massaStationProvider) throw new Error('Massa Station provider not found');

const network = await massaStationProvider.getNetwork();

console.log('Network Name:', network);
