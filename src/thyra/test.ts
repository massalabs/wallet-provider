import { ThyraProvider } from './ThyraProvider';

const account = new ThyraProvider();

async function createAccounts() {
  const accountData = await account.generateNewAccount('bleu');
  console.log(accountData);
}

createAccounts();
