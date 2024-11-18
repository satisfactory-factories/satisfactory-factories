module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  collectCoverage: true,
  collectCoverageFrom: [
    '**/*.{ts,tsx}', // Include only TypeScript and TSX files
    '**/*.spec.ts', // Include test files
    '**/*index.ts', // Exclude index files if they just re-export, as an example
    '!src/config/**', // Exclude config folder, mostly pointless to test
    '!**/*.module.ts', // Exclude module files, really hard to test with not much value
    '!**/*.d.ts', // Exclude declaration files, as they're not needed for testing
    '!src/router/**', // Exclude router folder, as it's mostly just a bunch of routes supplied by Vue3
    '!main.ts', // Exclude main.ts, as it's the entrypoint to the app
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['json-summary', 'text', 'lcov'],
}
