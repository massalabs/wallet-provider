module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  setupFilesAfterEnv: ['./test-e2e/setup.ts'],
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
    '^.+\\.jsx?$': 'babel-jest',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(@massalabs/wallet-provider|@hicaru/bearby.js|big-varint)/)',
  ],
  moduleNameMapper: {
    '^@massalabs/wallet-provider$': '<rootDir>/dist/esm/index.js',
  },
  roots: ['./test-e2e'],
  testEnvironmentOptions: {
    url: 'https://station.massa',
  },
};
