import exp from 'constants';
import { getWallets } from '../../src';

it('should generate a new account with name and address and delete it', async () => {
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

  await massaStationWallet.deleteAccount(newAccount.address);

  const accounts = await massaStationWallet.accounts();

  const isAccountDeleted = accounts.some(
    (account) => account.address === newAccount.address,
  );

  expect(isAccountDeleted).toBe(false);

  // print the account name and address
  console.log(
    'Account Name:',
    newAccount.accountName || 'no name',
    'Account Address:',
    newAccount.address,
    isAccountDeleted ? 'Account deleted' : 'Account not deleted',
  );
});
