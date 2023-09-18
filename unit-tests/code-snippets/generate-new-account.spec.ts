import { providers } from '@massalabs/wallet-provider';

describe('Generate new account', () => {
  afterAll(async () => {
    const availableProviders = await providers();
    const massaStationProvider = availableProviders.find(
      (p) => p.name() === 'MASSASTATION',
    );

    // stop the test if the provider is not available
    if (!massaStationProvider)
      throw new Error('Massa Station provider not found');

    const accounts = await massaStationProvider.accounts();
    const account = accounts.find((a) => a.name() === 'my-massa-wallet');

    // delete the account
    await massaStationProvider.deleteAccount(account.address());
  });

  it('should generate a new account with name and address', async () => {
    const availableProviders = await providers();
    const massaStationProvider = availableProviders.find(
      (p) => p.name() === 'MASSASTATION',
    );

    // stop the test if the provider is not available
    if (!massaStationProvider)
      throw new Error('Massa Station provider not found');

    // generate a new account
    const newAccount = await massaStationProvider.generateNewAccount(
      'my-massa-wallet',
    );

    expect(newAccount).toHaveProperty('name');
    expect(newAccount).toHaveProperty('address');

    // print the account name and address
    console.log(
      'Account Name:',
      newAccount.name || 'no name',
      'Account Address:',
      newAccount.address,
    );
  });
});
