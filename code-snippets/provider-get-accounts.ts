import { getWallets } from '../../src';

const availableWallets = await providers();
const massaStationWallet = availableWallets.find(
  (p) => p.name() === 'MASSASTATION',
);

// stop the test if the provider is not available
if (!massaStationWallet) throw new Error('Massa Station provider not found');

// get account object
const accounts = await massaStationWallet.accounts();

// print the account name and address
console.log('Accounts:', accounts);
