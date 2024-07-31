import { getWallets } from '../../src';

const availableWallets = await providers();
const massaStationWallet = availableWallets.find(
  (p) => p.name() === 'MASSASTATION',
);

if (!massaStationWallet) throw new Error('Massa Station provider not found');

const network = await massaStationWallet.getNetwork();

console.log('Network Name:', network);
