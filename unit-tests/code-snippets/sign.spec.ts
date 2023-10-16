import { providers } from '@massalabs/wallet-provider';
import { deleteAccount } from '../utils/provider-utils';

describe('Sign a message', () => {
  afterAll(async () => {
    await deleteAccount('signing-account');
  });

  it('should generate a new account and sign data with it', async () => {
    const availableProviders = await providers();
    const massaStationProvider = availableProviders.find(
      (p) => p.name() === 'MASSASTATION',
    );

    // stop the test if the provider is not available
    if (!massaStationProvider)
      throw new Error('Massa Station provider not found');

    const accountName = 'signing-account';
    const dataToSign = 'test';

    // generate a new account
    await massaStationProvider.generateNewAccount(accountName);

    // get account object
    const accounts = await massaStationProvider.accounts();
    const newAccount = accounts.find((a) => a.name() === accountName);

    const resp = await newAccount.sign(dataToSign);

    expect(resp).not.toBeNull();
    expect(resp.publicKey).not.toBeNull();
    expect(resp.base58Encoded).not.toBeNull();

    // print the account name and address
    console.log(
      'Account Address:',
      newAccount.address,
      'signed data:',
      dataToSign,
      'signature:',
      resp.base58Encoded,
    );
  });
});
