import {
  EAccountDeletionResponse,
  providers,
} from '@massalabs/wallet-provider';

const availableProviders = await providers();
const massaStationProvider = availableProviders.find(
  (p) => p.name() === 'MASSASTATION',
);

// stop the test if the provider is not available
if (!massaStationProvider) throw new Error('Massa Station provider not found');

// generate a new account
const newAccount = await massaStationProvider.generateNewAccount(
  'account-to-be-deleted',
);

const resp = await massaStationProvider.deleteAccount(newAccount.address);

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
