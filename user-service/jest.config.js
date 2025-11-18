module.exports = {
  testEnvironment: 'node',
  moduleFileExtensions: ['js', 'json', 'jsx', 'ts', 'tsx', 'node'],
  testMatch: ['**/src/**/*.test.js'],
  transform: {
    '^.+\\.jsx?$': 'babel-jest',
  },
};