import { providers } from '@massalabs/wallet-provider';
import { Args } from '@massalabs/web3-utils';
(async () => {
  console.log(await providers());

  const delay = (ms) => new Promise((res) => setTimeout(res, ms));

  console.log('[DAPP_HTML] Hello from Dapp! ');

  let providerList = await providers();

  console.log('[DAPP_HTML] Discovered Providers count', providerList.length);
  console.log('[DAPP_HTML] Discovered providers ...', providerList);

  // get a provider (not MASSASTATION)
  const myProvider = providerList.find((p) => p.name() === 'SPACE_X');
  console.log('[DAPP_HTML] Provider Name', myProvider);

  // import an account
  console.log('[DAPP_HTML] Importing an account ...');
  await myProvider.importAccount({
    privateKey: 'S12srNEAvZrTb9pktYeuePpuM4taW5dfmWAZYtdqyETWTBspkoT1',
    publicKey: 'P1a6pr1mDMpjtSfFvJ9svkdGkZvotL2Yidh5uyVKXS32WGWW14z',
  });
  console.log('[DAPP_HTML] Import finished!');

  // get accounts
  console.log('[DAPP_HTML] Retrieving the accounts again ...');
  const myAccounts = await myProvider.accounts();
  console.log('[DAPP_HTML] Provider accounts ...', myAccounts);

  // getting one account
  const myAccount = myAccounts[0];
  console.log('[DAPP_HTML] Account address ', myAccount.address());

  // getting account balance
  console.log('[DAPP_HTML] Retrieving the account balance ...');
  const accountBalance = await myAccount.balance();
  console.log(
    "[DAPP_HTML] Account's Final Balance = ",
    accountBalance.finalBalance,
  );
  console.log(
    "[DAPP_HTML] Account's Candidate Balance = ",
    accountBalance.candidateBalance,
  );

  // signing a message
  console.log('[DAPP_HTML] Signing a message ...');
  const signature = await myAccount.sign([0, 1, 2]);
  console.log('[DAPP_HTML] Account Signature = ', signature);

  // get nodes url from the provider
  console.log('[DAPP_HTML] Retrieving the nodes url ...');
  const nodes = await myProvider.getNodesUrls();
  console.log('[DAPP_HTML] Nodes url = ', nodes);

  // buy roles
  console.log('[DAPP_HTML] Buying rolls ...');
  const buyRollsTxData = await myAccount.buyRolls(
    BigInt('10'),
    BigInt('12000000'),
  );
  console.log('[DAPP_HTML] Buy Roles = ', buyRollsTxData);

  // sell roles
  console.log('[DAPP_HTML] Selling rolls ...');
  const sellRollsTxData = await myAccount.sellRolls(
    BigInt('2'),
    BigInt('12000000'),
  );
  console.log('[DAPP_HTML] Sell Roles = ', sellRollsTxData);

  // send transaction
  console.log('[DAPP_HTML] Sending transaction ...');
  const sendTxData = await myAccount.sendTransaction(
    BigInt('2'),
    'AU19tCSKtiE4k9MJLyLH5sWGDZ7Rr2SiBf1ti3XqeCptwsXGvkef',
    BigInt('12000000'),
  );
  console.log('[DAPP_HTML] Send Transaction = ', sendTxData);

  // interact with a smart contract
  console.log('[DAPP_HTML] Interacting with a smart contract ...');
  const account = 'AU19tCSKtiE4k9MJLyLH5sWGDZ7Rr2SiBf1ti3XqeCptwsXGvkef';
  const interaction = await myAccount.callSC(account, 'main', new Args(), '2');
  console.log('[DAPP_HTML] Interaction = ', interaction);

  // display as list
  const list = document.createElement('ul');
  list.innerHTML = `
  <li>Provider Name: ${myProvider.name()}</li>
  <li>Account Address: ${myAccount.address()}</li>
  <li>Account Final Balance: ${accountBalance.finalBalance}</li>
  <li>Account Candidate Balance: ${accountBalance.candidateBalance}</li>
  <li>Account Signature: ${signature.publicKey}</li>
  <li>Nodes Url: ${nodes}</li>
  <li>Buy Rolls Operation Id: ${buyRollsTxData.operationId}</li>
  <li>Sell Rolls Operation Id: ${sellRollsTxData.operationId}</li>
  <li>Send Transaction Operation Id: ${sendTxData.operationId}</li>
  <li>Interaction with SC (Operation Id): ${interaction.operationId}</li>
`;
  document.body.appendChild(list);
})();
