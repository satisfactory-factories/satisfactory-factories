module.exports = {
  globals: {
    XYZ: true /** Add globals from a potential global.d.ts here **/
  },
  env: {
    browser: true,
    commonjs: true,
    es2020: true
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended'
  ],
  parser: '@typescript-eslint/parser',
  plugins: [
    '@typescript-eslint'
  ],
  rules: {
    indent: 'off',
    quotes: 'off',
    'no-tabs': 'off',
    semi: 'error',
    'padded-blocks': 'off',
    'no-multi-spaces': 'off',
    'no-multiple-empty-lines': 'off',
    'spaced-comment': 'off',
    'operator-linebreak': 'off',
    'comma-dangle': 'off',
    'eol-last': 'off',
    'no-undef-init': 'off',
    'brace-style': 'off',
    'no-unneeded-ternary': 'off',
    'no-return-await': 'off',
    'max-len': [
      2,
      340,
      {
        ignoreComments: true,
        ignoreTrailingComments: true,
        ignoreUrls: true,
        ignoreStrings: true,
        ignoreTemplateLiterals: true
      }
    ],
    'no-trailing-spaces': 'warn',
    'space-before-function-paren': [
      'warn',
      {
        anonymous: 'always',
        named: 'never',
        asyncArrow: 'always'
      }
    ],
    eqeqeq: 'error',
    'require-await': 'error',
    'no-unreachable': 'warn',
    'lines-between-class-members': 'off',
    'no-useless-constructor': 'warn',
    'no-useless-escape': 'warn',
    'no-useless-return': 'warn',
    'valid-typeof': 'error',
    'prefer-promise-reject-errors': 'error',
    'handle-callback-err': 'error',
    'one-var': 'off',
    'no-mixed-requires': 'error',
    'new-cap': 'off',
    'no-empty-function': 'warn',
    'dot-notation': 'warn',
    'no-unused-vars': 'off',
    'no-param-reassign': 'warn',
    'no-useless-concat': 'warn',
    'array-callback-return': 'warn',
    'no-use-before-define': 'off',
    'import/no-useless-path-segments': 'off',
    'no-mixed-operators': 'off',
    'guard-for-in': 'off',
    curly: [
      'off',
      'multi-or-nest',
      'consistent'
    ],
    'prefer-template': 'error',
    'quote-props': 'off',
    'prefer-const': 'error',
    camelcase: 'off',
    '@typescript-eslint/ban-ts-comment': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'warn',
    '@typescript-eslint/no-this-alias': 'off',
    'no-console': 'off',
    '@typescript-eslint/ban-types': [
      'off',
      {
        types: {
          String: {
            message: 'Use string instead of String',
            fixWith: 'string'
          },
          '{}': {
            message: "Don't use {}, probably replace with 'undefined'"
          }
        }
      }
    ],
    '@typescript-eslint/no-explicit-any': [
      'warn',
      {
        fixToUnknown: false,
        ignoreRestArgs: true
      }
    ]
  }
};