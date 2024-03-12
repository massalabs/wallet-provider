import { providers } from '@massalabs/wallet-provider';

const availableProviders = await providers();
const massaStationProvider = availableProviders.find(
  (p) => p.name() === 'MASSASTATION',
);

if (!massaStationProvider) throw new Error('Massa Station provider not found');

const chainId = await massaStationProvider.getChainId();

console.log('Network Name:', chainId);
