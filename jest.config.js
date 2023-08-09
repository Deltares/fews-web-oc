module.exports = {
  preset: 'ts-jest/presets/js-with-ts',
  testEnvironment: "jsdom",
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  transform: {
    '^.+\\.vue$': 'vue-jest',
    '^.+\\.jsx?$': 'babel-jest',
  },
  reporters: ['default', 'jest-junit'],
  testMatch: [
    '**/tests/unit/**/*.spec.(js|jsx|ts|tsx)|**/__tests__/*.(js|jsx|ts|tsx)'
  ],
  transformIgnorePatterns: [
    '/node_modules/'
  ],
}
