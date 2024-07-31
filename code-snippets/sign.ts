import { getWallets } from '../../src';

const availableWallets = await providers();
const massaStationWallet = availableWallets.find(
  (p) => p.name() === 'MASSASTATION',
);

// stop the test if the provider is not available
if (!massaStationWallet) throw new Error('Massa Station provider not found');

const accountName = 'signing-account';
const dataToSign = 'test';

// generate a new account
await massaStationWallet.generateNewAccount(accountName);

// get account object
const accounts = await massaStationWallet.accounts();
const newAccount = accounts.find((a) => a.name() === accountName);

const resp = await newAccount.sign(dataToSign);

// print the account name and address
console.log(
  'Account Address:',
  newAccount.address,
  'signed data:',
  dataToSign,
  'signature:',
  resp.base58Encoded,
);
