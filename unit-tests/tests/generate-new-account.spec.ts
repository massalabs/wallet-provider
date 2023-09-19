import { providers } from '@massalabs/wallet-provider';

describe('Generate new account', () => {
  const accountName = 'already-exists-test-account';

  afterAll(async () => {
    const availableProviders = await providers();
    const massaStationProvider = availableProviders.find(
      (p) => p.name() === 'MASSASTATION',
    );

    // stop the test if the provider is not available
    if (!massaStationProvider)
      throw new Error('Massa Station provider not found');

    const accounts = await massaStationProvider.accounts();
    const account = accounts.find((a) => a.name() === accountName);

    // delete the account
    await massaStationProvider.deleteAccount(account.address());
  });

  it('should generate a new account, then fail to generate one with the same name', async () => {
    const availableProviders = await providers();
    const massaStationProvider = availableProviders.find(
      (p) => p.name() === 'MASSASTATION',
    );

    // stop the test if the provider is not available
    if (!massaStationProvider)
      throw new Error('Massa Station provider not found');

    // generate a new account
    const newAccount = await massaStationProvider.generateNewAccount(
      accountName,
    );

    expect(newAccount).toHaveProperty('name');
    expect(newAccount).toHaveProperty('address');

    // Catch console.error messages
    console.error = jest.fn();

    // Create a new account with the same name and expect an error
    await massaStationProvider.generateNewAccount(accountName).catch((err) => {
      expect(err).toEqual('This account name already exists');
    });
  });
});
