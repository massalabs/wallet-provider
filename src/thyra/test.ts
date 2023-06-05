import { Args } from '@massalabs/massa-web3';
import { ThyraAccount } from './ThyraAccount';
import { IContractReadOperationResponse } from '../account/IContractReadOperationResponse';
import { IDryRunData } from '../account/IDryRunData';

const account = new ThyraAccount(
  {
    address: 'AU1ZccersHqQKm45oNC8y4GQ97t3M6MkUr4kJjgF635xkDbzocP3',
    name: 'bleu',
  },
  'THYRA',
);

// interact with a smart contract
const contractAddress = 'AS12sCaiDjDUnSXtRnjBPKTcivK6pcczLr7aLJd8ALjRWz2GdNcee';
const amount = 0n;
const functionName = 'argEventAndReturn';
let args = new Args();
args.addString('Hello World!');

const dryRun = {
  dryRun: true,
};

console.log('calling SC ...');
account
  .callSC(contractAddress, functionName, args, amount, dryRun)
  .then((result) => {
    console.log(result);
  })
  .catch((err) => {
    console.error(err);
  });
