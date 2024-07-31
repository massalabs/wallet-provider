import { getWallets } from '../../src';
import { Wallet } from '../../src/wallet';

export async function getMassaStationWallet(): Promise<Wallet> {
  const availableWallets = await getWallets();
  const massaStationWallet = availableWallets.find(
    (p) => p.name() === 'MASSASTATION',
  );

  // stop the test if the wallet is not available
  if (!massaStationWallet) throw new Error('Massa Station wallet not found');

  return massaStationWallet;
}

export async function deleteAccount(address: string): Promise<void> {
  const massaStationWallet = await getMassaStationWallet();
  await massaStationWallet.deleteAccount(address);
}

export async function deleteStationAccountFromNickname(
  nickname: string,
): Promise<void> {
  const massaStationWallet = await getMassaStationWallet();
  const accounts = await massaStationWallet.accounts();
  const account = accounts.find((account) => account.accountName === nickname);

  if (!account) {
    console.log(`Account with nickname ${nickname} not found`);
    return;
  }

  await massaStationWallet.deleteAccount(account.address);
}
