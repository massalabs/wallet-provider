import { getWallets } from '../../src';

const availableWallets = await providers();
const massaStationWallet = availableWallets.find(
  (p) => p.name() === 'MASSASTATION',
);

if (!massaStationWallet) throw new Error('Massa Station provider not found');

const chainId = await massaStationWallet.getChainId();

console.log('Network Name:', chainId);
