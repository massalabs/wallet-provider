import { providers } from '@massalabs/wallet-provider';

it('should get network url', async () => {
  const availableProviders = await providers();
  const massaStationProvider = availableProviders.find(
    (p) => p.name() === 'MASSASTATION',
  );

  if (!massaStationProvider)
    throw new Error('Massa Station provider not found');

  const accounts = await massaStationProvider.accounts();
  const selectedAccount = accounts[0];
  const address = await selectedAccount.address();

  expect(address).toMatch(/^AU/);

  console.log('Account address', address);
});
