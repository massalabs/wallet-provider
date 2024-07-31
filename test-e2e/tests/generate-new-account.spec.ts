import { getMassaStationWallet } from '../utils/provider-utils';

describe('Generate new account', () => {
  const accountName = 'already-exists-test-account';

  afterAll(async () => {
    const massaStationWallet = await getMassaStationWallet();

    const accounts = await massaStationWallet.accounts();
    const account = accounts.find((a) => a.accountName === accountName);

    if (account) await massaStationWallet.deleteAccount(account.address);
  });

  it('should generate a new account, then fail to generate one with the same name', async () => {
    const massaStationWallet = await getMassaStationWallet();

    // generate a new account
    const newAccount = await massaStationWallet.generateNewAccount(accountName);

    expect(newAccount.accountName).toBe(accountName);

    // Catch console.error messages
    console.error = jest.fn();

    // Create a new account with the same name and expect an error
    await massaStationWallet.generateNewAccount(accountName).catch((err) => {
      expect(err).toEqual(
        `adding account in GenerateAccount: this account nickname already exists: ${accountName}`,
      );
    });
  });
});
