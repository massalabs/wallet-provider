import { providers } from "@massalabs/wallet-provider";
import { ClientFactory, fromMAS } from "@massalabs/massa-web3";

it('should create new operations: buy and sell roll', async () => {
  const availableProviders = await providers();
  const massaStationProvider = availableProviders.find(
    (p) => p.name() === 'MASSASTATION',
  );
  
  // stop the test if the provider is not available
  if (!massaStationProvider)
    throw new Error('Massa Station provider not found');

  // initialize the web3 client
  const firstAccount = (await massaStationProvider.accounts())[0];
  const web3client = await ClientFactory.fromWalletProvider(massaStationProvider, firstAccount);

  // create a new buy and sell roll operations
  const buyOperationId = await web3client.wallet().buyRolls({ fee: 0n, amount: 1n });
  const sellOperationId = await web3client.wallet().sellRolls({ fee: 0n, amount: 1n });

  expect(buyOperationId).toBeDefined();
  expect(sellOperationId).toBeDefined();
  
  // print the operation ids
  console.log(
    "Buy roll operation id", buyOperationId,
		"Sell roll operation id", sellOperationId
  );
});