export default {
  preset: 'ts-jest',
  testEnvironment: 'jsdom', // Required for DOM-related tests like Vue components or `localStorage`
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1', // Resolve `@` to `src/`
  },
  collectCoverage: true,
  collectCoverageFrom: [
    '**/*.{ts,tsx}', // Include TypeScript files
    '!**/*.spec.ts', // Exclude test files from coverage
    '!src/config/**', // Exclude the config folder
    '!**/*.module.ts', // Exclude module files
    '!**/*.d.ts', // Exclude declaration files
    '!src/router/**', // Exclude router folder
    '!main.ts', // Exclude entrypoint
  ],
  coverageDirectory: 'coverage', // Specify coverage output folder
  coverageReporters: ['json-summary', 'text', 'lcov'], // Output formats
  setupFilesAfterEnv: ['./jest.setup.ts'], // Ensure setup file is run after the environment is ready
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: 'tsconfig.json' }], // Inline ts-jest config
    '^.+\\.vue$': '@vue/vue3-jest',
  },
  moduleFileExtensions: ['js', 'ts', 'json', 'vue'], // Add `.vue` for component testing
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.json', // Ensure ts-jest uses your project’s tsconfig.json
    },
  },
}
