import { getWallets } from '../../src';

it('should get network url', async () => {
  const availableWallets = await getWallets();
  const massaStationWallet = availableWallets.find(
    (p) => p.name() === 'MASSASTATION',
  );

  if (!massaStationWallet) throw new Error('Massa Station provider not found');

  const infos = await massaStationWallet.networkInfos();

  expect(infos.name).toMatch(/(buildnet|mainnet)/);
  expect(infos.name).not.toBeUndefined();
  expect(infos.url).toContain('massa.net');
  expect([77658366n, 77658377n]).toContain(infos.chainId);

  console.log('Network Urls:', infos);
});
