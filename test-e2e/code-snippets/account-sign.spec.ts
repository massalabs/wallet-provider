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

  const message = 'hello world';
  const signature = await selectedAccount.sign(message);

  expect(signature).toHaveProperty('publicKey');
  expect(signature).toHaveProperty('base58Encoded');

  console.log('Signature:', signature);
});
