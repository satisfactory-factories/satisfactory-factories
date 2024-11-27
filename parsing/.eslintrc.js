module.exports = {
  root: true, // Ensure ESLint looks for configurations only in this file
  parser: '@typescript-eslint/parser', // Specifies the ESLint parser for TypeScript
  parserOptions: {
    ecmaVersion: 2020, // Allows for the parsing of modern ECMAScript features
    sourceType: 'module', // Allows for the use of imports
    ecmaFeatures: {
      jsx: false, // Set to true if using React/JSX
    },
  },
  plugins: [
    '@typescript-eslint', // Add TypeScript-specific linting rules
    'import', // Linting support for import/export syntax
  ],
  extends: [
    'eslint:recommended', // Use recommended rules from ESLint
    'plugin:@typescript-eslint/recommended', // Use recommended rules from the @typescript-eslint plugin
  ],
  rules: {
    // General ESLint rules
    'no-console': 'off', // Don't warn on console.logs
    'no-unused-vars': 'off', // Disable as it conflicts with @typescript-eslint/no-unused-vars
    'no-empty-function': 'off', // Disable as it conflicts with @typescript-eslint/no-empty-function

    // TypeScript-specific rules
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }], // Warn on unused variables except those starting with "_"
    '@typescript-eslint/no-empty-function': ['warn'], // Warn on empty functions
    '@typescript-eslint/explicit-module-boundary-types': 'off', // Disable explicit return types for simplicity
    '@typescript-eslint/no-explicit-any': 'warn', // Discourage use of `any`, but allow it with a warning

    // Import rules
    'import/order': [
      'warn',
      {
        groups: ['builtin', 'external', 'internal', ['parent', 'sibling', 'index']],
        'newlines-between': 'always',
      },
    ],
  },
  settings: {
    "import/resolver": {
      typescript: {
        alwaysTryTypes: true // Always try to resolve types under `@types` directory even if not explicitly imported
      },
      node: {
        extensions: [".js", ".jsx", ".ts", ".tsx"] // Include TypeScript extensions
      }
    }
  },
  env: {
    node: true, // For Node.js environment
    browser: false, // If your app runs in a browser
    es2020: true, // Use modern ES features
  },
  ignorePatterns: [
    'node_modules/',
    'dist/',
  ]
};
