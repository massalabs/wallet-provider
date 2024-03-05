module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
    '^.+\\.jsx?$': 'babel-jest',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(@massalabs/wallet-provider|@hicaru/bearby.js)/)',
  ],
  moduleNameMapper: {
    '^@massalabs/wallet-provider$': '<rootDir>/dist/esm/index.js',
  },
  roots: ['./test-e2e'],
  testEnvironmentOptions: {
    url: 'https://station.massa',
  },
};
