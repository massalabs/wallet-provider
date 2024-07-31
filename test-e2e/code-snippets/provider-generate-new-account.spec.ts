import { getWallets } from '../../src';

import { deleteStationAccountFromNickname } from '../utils/provider-utils';

describe('Generate new account', () => {
  afterAll(async () => {
    await deleteStationAccountFromNickname('my-massa-wallet');
  });

  it('should generate a new account with name and address', async () => {
    const availableWallets = await getWallets();
    const massaStationWallet = availableWallets.find(
      (p) => p.name() === 'MASSASTATION',
    );

    // stop the test if the provider is not available
    if (!massaStationWallet)
      throw new Error('Massa Station provider not found');

    // generate a new account
    const newAccount =
      await massaStationWallet.generateNewAccount('my-massa-wallet');

    expect(newAccount.accountName).toBe('my-massa-wallet');

    // print the account name and address
    console.log(
      'Account Name:',
      newAccount.accountName || 'no name',
      'Account Address:',
      newAccount.address,
    );
  });
});
