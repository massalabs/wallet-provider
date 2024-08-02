import { WalletName } from '../../../src';
import { MassaStationWallet } from '../../../src/massaStation/MassaStationWallet';
import { getWallet } from '../../../src/walletsManager/walletList';

export async function getMassaStationWallet(): Promise<MassaStationWallet> {
  const massaStationWallet = await getWallet(WalletName.MassaStation);

  // stop the test if the wallet is not available
  if (!massaStationWallet) throw new Error('Massa Station wallet not found');

  return massaStationWallet as MassaStationWallet;
}

export async function deleteAccount(address: string): Promise<void> {
  const massaStationWallet = await getMassaStationWallet();
  await massaStationWallet.deleteAccount(address);
}

export async function deleteStationAccountFromNickname(
  nickname: string,
): Promise<void> {
  const massaStationWallet = await getMassaStationWallet();
  let accounts = await massaStationWallet.accounts();
  let account = accounts.find((account) => account.accountName === nickname);

  if (!account) {
    console.log(`Account with nickname ${nickname} not found`);
    return;
  }

  await massaStationWallet.deleteAccount(account.address);

  // check if the account was deleted
  accounts = await massaStationWallet.accounts();
  account = accounts.find((account) => account.accountName === nickname);
  if (account) {
    throw new Error(`Account with nickname ${nickname} was not deleted`);
  }
}