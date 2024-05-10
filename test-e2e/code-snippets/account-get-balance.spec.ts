import { providers } from '@massalabs/wallet-provider';
import { deleteStationAccountFromNickname } from '../utils/provider-utils';

afterAll(async () => {
  await deleteStationAccountFromNickname('signing-account');
});

it('should get the balance', async () => {
  const availableProviders = await providers();
  const massaStationProvider = availableProviders.find(
    (p) => p.name() === 'MASSASTATION',
  );

  const accountName = 'my-account';

  await massaStationProvider.generateNewAccount(accountName);
  if (!massaStationProvider)
    throw new Error('Massa Station provider not found');

  const accounts = await massaStationProvider.accounts();
  const selectedAccount = accounts[0];
  const balance = await selectedAccount.balance();

  // to be a number
  expect(balance).toHaveProperty('finalBalance');
  expect(balance).toHaveProperty('candidateBalance');

  console.log('Account balance', balance);
});
