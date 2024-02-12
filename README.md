# Wallet-Provider

> **PREREQUISITES:**
> 
>    - NodeJS 18+
>    - npm / yarn (refer to package.json for specifics)

`Wallet-provider` is a TypeScript library designed to seamlessly connect frontend applications with MassaStation and browser wallet extensions adhering to the [massa standard](https://github.com/massalabs/massa-standards/blob/main/wallet/dapps-communication.md). This library provides a gateway to all massa-blockchain wallets, offering standardized functionalities for effortless integration.

## **Installation**

`Wallet-provider` can be integrated as a library within frameworks or bundled for direct browser use.

### **For Frameworks (Node.js/React/Vue.js)**

```sh
npm install @massalabs/wallet-provider
```

## Documentation

Wallet-provider provides complete documentation of all available functions and objects.

To generate the documentation for a specific branch, run the following command:

```sh
npm run doc
```

The documentation will be generated in the `docs/documentation/html` directory.

## Usage

- Go to [Web3 client initialization](https://docs.massa.net/docs/build/massa-web3#with-wallet-provider) to learn how to use wallet provider in a dapp.

- Discover dApp examples with associated frontends at the [massa-sc-examples](https://github.com/massalabs/massa-sc-examples) repository.

## Example

Wallet-provider is meant to be used with massa-web3 but can also be used as a standalone library.
Here is a simple example of how to use Wallet-provider:

```ts

import { providers } from  "@massalabs/wallet-provider";


// get all available massa-wallet providers

const  providers = providers();
  

// get a provider

const  myProvider = providers[0];

console.log("Provider Name", myProvider.name());


// import an account via the massa-wallet provider

console.log("Importing an account ...");

const  privateKey = "Sxxxxxxxxxxxxxx";

const  publicKey = "Pxxxxxxxxxxxxxxx";


await  myProvider.importAccount(publicKey, privateKey);


// get accounts

console.log("Retrieving the accounts ...");

const  myAccounts = await myProvider.accounts();

console.log("Provider accounts ...", myAccounts);
  

// getting one account

const  myAccount = myAccounts[0];

console.log("Account address ", myAccount.address());
 

// getting account balance

console.log("Retrieving the account balance ...");

const  accountBalance = await myAccount.balance();

console.log("Account Balance = ", accountBalance.balance);
 

// signing a message

console.log("Signing a message ...");

const  signature = await myAccount.sign([0, 1, 2]);

console.log("Signature = ", signature);
  

// deleting an account

console.log("Deleting an account ...");

await  myProvider.importAccount(myAccount.address());

```

## Contributing

Community contributions are highly valued! If you're keen on contributing to `Wallet-provider`, please check out our [CONTRIBUTING guidelines](CONTRIBUTING.md).

## License

`Wallet-provider` is distributed under the [MIT License](LICENSE).

