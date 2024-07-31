import {
  EAccountDeletionResponse,
  getWallets,
} from '@massalabs/wallet-provider';

const availableWallets = await getWallets();
const massaStationWallet = availableWallets.find(
  (p) => p.name() === 'MASSASTATION',
);

// stop the test if the provider is not available
if (!massaStationWallet) throw new Error('Massa Station provider not found');

// generate a new account
const newAccount = await massaStationWallet.generateNewAccount(
  'account-to-be-deleted',
);

const resp = await massaStationWallet.deleteAccount(newAccount.address);

// print the account name and address
console.log(
  'Account Name:',
  newAccount.name || 'no name',
  'Account Address:',
  newAccount.address,
  resp.response === EAccountDeletionResponse.OK
    ? 'has been deleted'
    : 'could not be deleted',
);
