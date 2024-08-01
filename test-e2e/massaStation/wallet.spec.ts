import { MassaStationAccount } from '../../src';
import { msWallet } from '../setup';
import { deleteStationAccountFromNickname } from './utils/utils';

export const accountName = 'ZeAccountName';
export let msAccount: MassaStationAccount;

describe('MassaStation wallet tests', () => {
  beforeAll(async () => {
    msAccount = await msWallet.generateNewAccount(accountName);
  });

  afterAll(async () => {
    await deleteStationAccountFromNickname(accountName);
  });

  it('new account is created', async () => {
    expect(msAccount.accountName).toBe(accountName);
    expect(await msWallet.accounts()).toContainEqual(msAccount);
  });

  it('fail to create a wallet with same name', async () => {
    await expect(async () => {
      await msWallet.generateNewAccount(accountName);
    }).rejects.toThrow(
      `adding account in GenerateAccount: this account nickname already exists: ${accountName}`,
    );
  });

  it('fails to delete a non existing address', async () => {
    await expect(async () => {
      await msWallet.deleteAccount('non-existing-address');
    }).rejects.toThrow('Account not found');
  });

  it('should get network infos', async () => {
    const infos = await msWallet.networkInfos();
    console.log('Network Urls:', infos);
    expect(infos.name).toMatch(/(buildnet|mainnet)/);
    expect(infos.url).toContain('massa.net');
    expect([77658366n, 77658377n]).toContain(infos.chainId);
  });

  it('should sign a message', async () => {
    const dataToSign = 'test Message';
    const resp = await msAccount.sign(dataToSign);

    // TODO: implement more checks
    expect(resp.publicKey).toBeDefined();
    expect(resp.signature).toBeDefined();
  });
});
