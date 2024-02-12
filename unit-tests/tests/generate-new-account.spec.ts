import { getMassaStationProvider } from '../utils/provider-utils';

describe('Generate new account', () => {
  const accountName = 'already-exists-test-account';

  afterAll(async () => {
    const massaStationProvider = await getMassaStationProvider();

    const accounts = await massaStationProvider.accounts();
    const account = accounts.find((a) => a.name() === accountName);

    // delete the account
    await massaStationProvider.deleteAccount(account.address());
  });

  it('should generate a new account, then fail to generate one with the same name', async () => {
    const massaStationProvider = await getMassaStationProvider();

    // generate a new account
    const newAccount =
      await massaStationProvider.generateNewAccount(accountName);

    expect(newAccount).toHaveProperty('name');
    expect(newAccount).toHaveProperty('address');

    // Catch console.error messages
    console.error = jest.fn();

    // Create a new account with the same name and expect an error
    await massaStationProvider.generateNewAccount(accountName).catch((err) => {
      expect(err).toEqual(`adding account in GenerateAccount: this account nickname already exists: ${accountName}`);
    });
  });
});
