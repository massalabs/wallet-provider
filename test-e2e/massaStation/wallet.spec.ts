import {
  Args,
  bytesToStr,
  Mas,
  MRC20,
  NetworkName,
  PublicApiUrl,
  SmartContract,
} from '@massalabs/massa-web3';
import { MassaStationAccount } from '../../src';
import { accountName, msWallet, publicKey } from '../setup';
import { deleteStationAccountFromNickname, getScByteCode } from './utils/utils';

let account: MassaStationAccount;

describe('MassaStation wallet tests', () => {
  beforeAll(async () => {
    const accounts = await msWallet.accounts();
    const acc = accounts.find((acc) => acc.accountName === accountName);
    if (!acc) {
      throw new Error(`Account ${accountName} not found`);
    }
    account = acc;
    const balance = await account.balance();
    // eslint-disable-next-line no-console
    console.log(
      `Using account ${account.accountName} with address ${
        account.address
      }. balance: ${Mas.toString(balance, 2)}`,
    );
  });

  it('Create / Delete account', async () => {
    const newAccountName = 'ZeAccountName';
    const newAccount = await msWallet.generateNewAccount(newAccountName);

    expect(newAccount.accountName).toBe(newAccountName);
    expect(await msWallet.accounts()).toContainEqual(newAccount);

    await deleteStationAccountFromNickname(newAccountName);
    expect(await msWallet.accounts()).not.toContainEqual(newAccount);
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
    expect(infos.name).toEqual(NetworkName.Buildnet);
    expect(infos.url).toEqual(PublicApiUrl.Buildnet);
    expect(infos.chainId).toEqual(77658366n);
    expect(infos.minimalFee).toEqual(10000000n);
  });

  it('should sign a message', async () => {
    const dataToSign = 'test Message';
    const resp = await account.sign(dataToSign);

    // TODO: implement more checks
    expect(resp.publicKey).toEqual(publicKey);
    expect(resp.signature).toBeDefined();
  });

  it('readSC', async () => {
    const USDCaddr = 'AS12k8viVmqPtRuXzCm6rKXjLgpQWqbuMjc37YHhB452KSUUb9FgL';
    const USDC = new MRC20(account, USDCaddr);
    const balance = await USDC.balanceOf(account.address);
    expect(balance).toEqual(0n);
  });

  it('callSC', async () => {
    const USDCaddr = 'AS12k8viVmqPtRuXzCm6rKXjLgpQWqbuMjc37YHhB452KSUUb9FgL';
    const amount = 12345678n;
    const USDC = new SmartContract(account, USDCaddr);

    const res = await USDC.read(
      'allowance',
      new Args()
        .addString(account.address)
        .addString('AS12k8viVmqPtRuXzCm6rKXjLgpQWqbuMjc37YHhB452KSUUb9FgL'),
    );
    const allowance = new Args(res.value).nextU256();

    const operation = await USDC.call(
      'increaseAllowance',
      new Args()
        .addString('AS12k8viVmqPtRuXzCm6rKXjLgpQWqbuMjc37YHhB452KSUUb9FgL')
        .addU256(amount),
    );
    await operation.waitSpeculativeExecution();

    const newAllowance = await USDC.read(
      'allowance',
      new Args()
        .addString(account.address)
        .addString('AS12k8viVmqPtRuXzCm6rKXjLgpQWqbuMjc37YHhB452KSUUb9FgL'),
    );
    expect(new Args(newAllowance.value).nextU256()).toEqual(allowance + amount);
  });

  it('deploySC: deploy random bytecode -> expect to fail', async () => {
    const byteCode = new Uint8Array([1, 2, 3, 4]);
    await expect(SmartContract.deploy(account, byteCode)).rejects.toThrow();
  });

  it('deploySC: deploy correct smart contract bytecode', async () => {
    // deploy the hello world smart contract
    const byteCode = getScByteCode('helloWorldSC.wasm');
    const helloWorldName = 'John Doe';
    const NAME_KEY = 'name_key';
    const smartContract = await SmartContract.deploy(
      account,
      byteCode,
      new Args().addString(helloWorldName),
      {
        coins: Mas.fromMilliMas(2n),
      },
    );
    expect(smartContract.address).toBeDefined();
    console.log(`Smart contract deployed at address ${smartContract.address}`);
    const storageName = await account.readStorage(
      smartContract.address,
      [NAME_KEY],
      false,
    );
    expect(storageName[0]).toBeTruthy();
    const newName = bytesToStr(storageName[0] as Uint8Array);

    expect(newName).toEqual(helloWorldName);
  });

  // TODO investigate why fees are deducted 2 times
  it.skip('transfer', async () => {
    const to = 'AU1wN8rn4SkwYSTDF3dHFY4U28KtsqKL1NnEjDZhHnHEy6cEQm53';
    const amount = 1000n;
    const balance = await account.balance(true);
    const operation = await account.transfer(to, amount);

    await operation.waitFinalExecution();

    const { minimalFee } = await msWallet.networkInfos();
    const newBalance = await account.balance(true);

    expect(newBalance).toEqual(balance - amount - minimalFee);
  });
});
