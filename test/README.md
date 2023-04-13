# Testing wallet-provider
A simple way to test wallet-provider.

## How to test ?

### Automatically

if you're not on windows, simply run `npm run test` at the root of the project.

### Manually

1. Generate the bundle file using `npm run build`
2. Copy the bundle.js generated file to `test\dapp` dir
3. Go to the `test` folder
4. Run the test using `npx playwright test`
