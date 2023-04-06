# massa-wallet-provider

`Massa-wallet-provider` is a TypeScript library that one could utilize to establish a connection between a frontend dapp application and any browser wallet extensions that implement the [massa standard](https://github.com/massalabs/massa-standards/blob/main/wallet/dapps-communication.md). With this library one can access all massa-blockchain wallets and their standardized functionalities for ready use.

## Usage

`Massa-wallet-provider` could be used as a library for frameworks or as a stand-alone bundled js file which can be easily loaded into the browser.

### Library (Node.js/React/Vue.js) usage

> npm install @massalabs/massa-wallet-provider

### Browser usage

Add the following script to your html file:

```ts
<script
    type="text/javascript"
    src="https://cdn.jsdelivr.net/npm/@massalabs/massa-wallet-provider@x.x.x/bundle.js"
></script>
```

whereby the x.x.x is one of the available released versions under
[Massa-web3's releases page](https://github.com/massalabs/massa-wallet-provider/releases):

In your code, once the script is fully loaded, just use `window.wallet` to access all `massa-wallet-provider` exports.

```ts
<script>console.log("Massa Wallets ", window.massa);</script>
```

### Documentation

Complete documentation can be found here:

TODO

### Requirements

-   NodeJS 16+
-   npm / yarn (see package.json)


### Web3 Wallet Provider Initialization & Usage

There are two types of client initialization. The first one is connecting to Massa's public rpc node using a so-called default client. Please note that specifying a base account is only optional at this point. The code below illustrates how to do that:

```ts
import { providers } from "@massalabs/massa-wallet-provider";

    // get all available massa-wallet providers
    const providers = providers();

    // get a provider
    const myProvider = providers[0];
    console.log("Provider Name", myProvider.name());

    // import an account via the massa-wallet provider
    console.log("Importing an account ...");
    const privateKey = "Sxxxxxxxxxxxxxx";
    const publicKey = "Pxxxxxxxxxxxxxxx";

    await myProvider.importAccount(publicKey, privateKey);

    // get accounts
    console.log("Retrieving the accounts ...");
    const myAccounts = await myProvider.accounts();
    console.log("Provider accounts ...", myAccounts);

    // getting one account
    const myAccount = myAccounts[0];
    console.log("Account address ", myAccount.address());

    // getting account balance
    console.log("Retrieving the account balance ...");
    const accountBalance = await myAccount.balance();
    console.log("Account Balance = ", accountBalance.balance);

    // signing a message
    console.log("Signing a message ...");
    const signature = await myAccount.sign([0, 1, 2]);
    console.log("Signature = ", signature);

    // deleting an account
    console.log("Deleting an account ...");
    await myProvider.importAccount(myAccount.address());
```

## Contributing and testing

1. Run `npm run install` to install all dependencies
2. Run `npm run build` to build distribution content
3. Run `npm run test` to run integration and unit tests