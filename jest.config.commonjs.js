module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
    '^.+\\.jsx?$': 'babel-jest',
  },
  transformIgnorePatterns: ['node_modules/(?!(@hicaru/bearby.js)/)'],
  moduleNameMapper: {
    '^@massalabs/wallet-provider$': '<rootDir>/dist/cmd/index.js',
  },
  roots: ['./unit-tests'],
};
