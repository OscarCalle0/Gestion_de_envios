module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/test/helpers/testSetup.ts'],
  moduleNameMapper: {
    '^@application/(.*)$': '<rootDir>/src/application/$1',
    '^@domain/(.*)$': '<rootDir>/src/domain/$1',
    '^@infrastructure/(.*)$': '<rootDir>/src/infrastructure/$1',
    '^@configuration$': '<rootDir>/src/configuration/index',
    '^@configuration/(.*)$': '<rootDir>/src/configuration/$1',
    '^@util$': '<rootDir>/src/util/index',
    '^@util/(.*)$': '<rootDir>/src/util/$1'
  },
  testMatch: ['**/*.test.ts'],
  verbose: true,
  forceExit: true,
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true
};
