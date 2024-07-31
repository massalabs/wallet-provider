import { getWallets } from '../../src';

const availableWallets = await providers();
const massaStationWallet = availableWallets.find(
  (p) => p.name() === 'MASSASTATION',
);

// stop the test if the provider is not available
if (!massaStationWallet) throw new Error('Massa Station provider not found');

// generate a new account
const newAccount =
  await massaStationWallet.generateNewAccount('my-massa-wallet');

// print the account name and address
console.log(
  'Account Name:',
  newAccount.name || 'no name',
  'Account Address:',
  newAccount.address,
);
