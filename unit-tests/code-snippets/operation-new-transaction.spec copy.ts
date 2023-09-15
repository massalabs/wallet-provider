import { providers } from '@massalabs/wallet-provider';
import { ClientFactory, fromMAS } from '@massalabs/massa-web3';

it('should create a new operation: transaction', async () => {
  const availableProviders = await providers();
  const massaStationProvider = availableProviders.find(
    (p) => p.name() === 'MASSASTATION',
  );

  // stop the test if the provider is not available
  if (!massaStationProvider)
    throw new Error('Massa Station provider not found');

  // initialize the web3 client
  const firstAccount = (await massaStationProvider.accounts())[0];
  const web3Client = await ClientFactory.fromWalletProvider(
    massaStationProvider,
    firstAccount,
  );

  // create a new transaction operation
  const operationId = await web3Client.wallet().sendTransaction({
    fee: 0n,
    amount: fromMAS(10),
    recipientAddress: 'AU1RAQ8wb3Jg8CdwrAwo79zWKoCiXxe7mNxiTeDvdvqQuJ5eKw5F',
  });

  expect(operationId).toBeDefined();

  // print the operation id
  console.log('Operation id:', operationId);
});
