import { providers } from '@massalabs/wallet-provider';

export async function getMassaStationProvider(): Promise<any> {
  const availableProviders = await providers();
  const massaStationProvider = availableProviders.find(
    (p) => p.name() === 'MASSASTATION',
  );

  // stop the test if the provider is not available
  if (!massaStationProvider)
    throw new Error('Massa Station provider not found');

  return massaStationProvider;
}

export async function deleteAccount(address: string): Promise<void> {
  const massaStationProvider = await getMassaStationProvider();
  await massaStationProvider.deleteAccount(address);
}

export async function deleteStationAccountFromNickname(
  nickname: string,
): Promise<void> {
  const massaStationProvider = await getMassaStationProvider();
  const accounts = await massaStationProvider.accounts();
  const account = accounts.find((account) => account.name() === nickname);

  if (!account) {
    throw new Error(`Account with nickname ${nickname} not found`);
  }

  await massaStationProvider.deleteAccount(account.address());
}
