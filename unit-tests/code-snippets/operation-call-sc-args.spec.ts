import { providers } from "@massalabs/wallet-provider";
import { ClientFactory, Args } from "@massalabs/massa-web3";

it('should create a new operation: call SC with Args', async () => {
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

  // call the smart contract
  const operationId = await web3client.smartContracts().callSmartContract({
    fee: 0n,
    maxGas: 1_000_000n,
    targetAddress: "AS1u8i5H1RQU5qD8R8hQzugA8HwWmS9qqyZNjhvR9WywUP17v1od",
    functionName: "helloWorld",
    parameter: new Args().addString("Hello World !!"),
  });

  expect(operationId).toBeDefined();
  
  // print the operation id
  console.log("Operation id:", operationId);
});