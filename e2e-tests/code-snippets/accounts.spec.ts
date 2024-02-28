import { providers } from '@massalabs/wallet-provider';

it('should generate a new account and list all wallets', async () => {
  const availableProviders = await providers();
  const massaStationProvider = availableProviders.find(
    (p) => p.name() === 'MASSASTATION',
  );

  // stop the test if the provider is not available
  if (!massaStationProvider)
    throw new Error('Massa Station provider not found');

  // get account object
  const accounts = await massaStationProvider.accounts();

  // print the account name and address
  console.log('Accounts:', accounts);
});
