import { getWallets } from '../../src';

const availableWallets = await providers();
const massaStationWallet = availableWallets.find(
  (p) => p.name() === 'MASSASTATION',
);

if (!massaStationWallet) throw new Error('Massa Station provider not found');

const networkUrls = await massaStationWallet.getNodesUrls();

console.log('Network Urls:', networkUrls);
