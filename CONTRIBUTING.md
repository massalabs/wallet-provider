# Contributing to Wallet-Provider
Thank you for considering contributing to Wallet-Provider!

## Reporting Bugs
If you discover a bug, please create a [new issue](https://github.com/massalabs/wallet-provider/issues/new?assignees=&labels=issue%3Abug&template=bug.md&title=) on our GitHub repository.
In your issue, please include a clear and concise description of the bug, any relevant code snippets, error messages, and steps to reproduce the issue.

## Installation
To start developing with wallet-provider, you must install all the necessary dev dependencies. You can do so by running the following command:

```sh
npm install
```
and then :
```sh
npx playwright install --with-deps
```

This will install all the required packages listed in the package.json file, allowing you to update, fix, or improve wallet-provider in any way you see fit. 

The second command will install the playwright and it's dependencies, allowing you to run the tests.

## Contributing Code
We welcome contributions in the form of bug fixes, enhancements, and new features.

To contribute code, please follow these steps:

1. Fork the wallet-provider repository to your own account.
2. Create a new branch from the `main` branch for your changes.
3. Make your changes and commit them to your branch.
4. Push your branch to your fork.
5. Create a pull request from your branch to the develop branch of the wallet-provider repository.

> **NOTE:** When creating a pull request, please include a clear and concise title and description of your changes, as well as any relevant context or background information.


## Tests
Please ensure that your changes include any necessary tests.

You can run the following command to run the tests:

```sh
npm run test
```

## Code Style
Please ensure that your code follows the existing code style used in the project.
We use the [MassaLabs Prettier configuration](https://github.com/massalabs/prettier-config-as) and [MassaLabs ESLint configuration](https://github.com/massalabs/eslint-config) for formatting and linting.

You can run the following command to format your code before committing:

```sh
npm run fmt
```


## License
By contributing to wallet-provider, you agree that your contributions will be licensed under the MIT License.


## Documentation
To ensure the codebase is well-documented, we use ts-doc to comment our functions and modules following a specific pattern. This pattern includes describing the function's purpose, its parameters and return types, and any potential errors it may throw.

In addition, you can find additional information and documentation in the code by looking for @privateRemarks tags. These tags provide extra context and details that may not be immediately obvious from the function's public documentation.

We highly encourage all contributors to take the time to write clear, concise, and comprehensive documentation for any changes or new features they introduce to the codebase. Good documentation makes it easier for others to understand the code and reduces the likelihood of bugs and errors down the line.