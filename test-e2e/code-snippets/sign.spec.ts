// import { getWallets } from '../../src';

import { getWallets } from '../../src';
import { deleteStationAccountFromNickname } from '../utils/provider-utils';

describe('Sign a message', () => {
  afterAll(async () => {
    await deleteStationAccountFromNickname('signing-account');
  });

  it('should generate a new account and sign data with it', async () => {
    const wallets = await getWallets();
    const massaStationWallet = wallets.find((p) => p.name() === 'MASSASTATION');

    // stop the test if the provider is not available
    if (!massaStationWallet)
      throw new Error('Massa Station provider not found');

    const accountName = 'signing-account';
    const dataToSign = 'test';

    // generate a new account
    await massaStationWallet.generateNewAccount(accountName);

    //   // get account object
    const accounts = await massaStationWallet.accounts();
    const newAccount = accounts.find((a) => a.accountName === accountName);

    if (!newAccount) {
      throw new Error('Account not found');
    }

    const resp = await newAccount.sign(dataToSign);

    expect(resp).not.toBeNull();
    expect(resp.publicKey).not.toBeNull();
    expect(resp.signature).not.toBeNull();

    // print the account name and address
    console.log(
      'Account Address:',
      newAccount.address,
      'signed data:',
      dataToSign,
      'signature:',
      resp.signature,
    );
  });
});
