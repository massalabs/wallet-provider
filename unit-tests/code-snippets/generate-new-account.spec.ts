import { providers } from '@massalabs/wallet-provider';
import { deleteAccount } from '../utils/provider-utils';

describe('Generate new account', () => {
  afterAll(async () => {
    await deleteAccount('my-massa-wallet');
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
    const newAccount =
      await massaStationProvider.generateNewAccount('my-massa-wallet');

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
