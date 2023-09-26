import { providers } from '@massalabs/wallet-provider';
import { ClientFactory } from '@massalabs/massa-web3';
import { C8ex2d7X8pkBlockchainCaller } from '../../helpers/8ex2d7X8pkCaller';

// Before running this test, you need to:
// - deploy the smart contract `hello world` to the blockchain.
// - replace the address below with the address of the deployed smart contract.
// - generate the smart contract helper executing the following command:
//   `npx massa-proto --addr=AS12CvQGUaaSd933VNQGoQ8zja2Xvs6GhRJMDswLq2p8ex2d7X8pk --gen=web3`

it('should create a new operation: call SC', async () => {
  const availableProviders = await providers();
  const massaStationProvider = availableProviders.find(
    (p) => p.name() === 'MASSASTATION',
  );

  // stop the test if the provider is not available
  if (!massaStationProvider)
    throw new Error('Massa Station provider not found');

  // initialize the web3 client
  const firstAccount = (await massaStationProvider.accounts())[0];
  const web3client = await ClientFactory.fromWalletProvider(
    massaStationProvider,
    firstAccount,
  );

  // call the smart contract
  const caller = await C8ex2d7X8pkBlockchainCaller.newDefault(
    web3client.wallet(),
  );
  const result = await caller.helloWorld('Hey there!');

  console.log(result);
});
