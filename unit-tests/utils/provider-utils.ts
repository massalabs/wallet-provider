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
