// .eslintrc.js

module.exports = {
  env: {
    node: true,
    es2021: true,
    jest: true
  },
  extends: [
    'eslint:recommended',
    'airbnb-base'
  ],
  parserOptions: {
    ecmaVersion: 12,
    sourceType: 'module'
  },
  rules: {
    // Indentation
    'indent': ['error', 4, {
      'SwitchCase': 1,
      'VariableDeclarator': 1,
      'outerIIFEBody': 1,
      'FunctionDeclaration': {
        'parameters': 1,
        'body': 1
      },
      'FunctionExpression': {
        'parameters': 1,
        'body': 1
      },
      'CallExpression': {
        'arguments': 1
      },
      'ArrayExpression': 1,
      'ObjectExpression': 1,
      'ImportDeclaration': 1,
      'flatTernaryExpressions': false
    }],

    // Line length
    'max-len': ['error', {
      code: 120,
      ignoreComments: true,
      ignoreStrings: true,
      ignoreTemplateLiterals: true,
      ignoreRegExpLiterals: true
    }],

    // File length
    'max-lines': ['error', {
      max: 200,
      skipBlankLines: true,
      skipComments: true
    }],

    // Comma dangle
    'comma-dangle': ['error', 'never'],

    // Quotes
    'quotes': ['error', 'single', { avoidEscape: true }],

    // Semicolons
    'semi': ['error', 'always'],

    // Console statements (warning only)
    'no-console': 'warn',

    // Unused variables
    'no-unused-vars': ['error', {
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_'
    }],

    // Class methods that don't use this
    'class-methods-use-this': 'off',

    // Require await in async functions
    'require-await': 'error',

    // No multiple empty lines
    'no-multiple-empty-lines': ['error', { max: 2, maxEOF: 1 }],

    // Object curly spacing
    'object-curly-spacing': ['error', 'always'],

    // Array bracket spacing
    'array-bracket-spacing': ['error', 'never'],

    // Arrow function parentheses
    'arrow-parens': ['error', 'as-needed'],

    // Arrow function body style
    'arrow-body-style': ['error', 'as-needed'],

    // Prefer const
    'prefer-const': 'error',

    // No var
    'no-var': 'error',

    // Prefer template literals
    'prefer-template': 'error',

    // No else return
    'no-else-return': 'error',

    // Consistent return
    'consistent-return': 'off',

    // Import extensions
    'import/extensions': ['error', 'never', {
      js: 'never',
      json: 'always'
    }],

    // Import order
    'import/order': ['error', {
      groups: [
        'builtin',
        'external',
        'internal',
        'parent',
        'sibling',
        'index'
      ],
      'newlines-between': 'always'
    }],

    // No underscore dangle (allow for private methods/properties)
    'no-underscore-dangle': 'off',

    // Allow for-of loops
    'no-restricted-syntax': [
      'error',
      {
        selector: 'ForInStatement',
        message: 'for..in loops iterate over the entire prototype chain, which is virtually never what you want. Use Object.{keys,values,entries}, and iterate over the resulting array.'
      },
      {
        selector: 'LabeledStatement',
        message: 'Labels are a form of GOTO; using them makes code confusing and hard to maintain and understand.'
      },
      {
        selector: 'WithStatement',
        message: '`with` is disallowed in strict mode because it makes code impossible to predict and optimize.'
      }
    ],

    // Allow await in loops when necessary
    'no-await-in-loop': 'off',

    // Allow continue statements
    'no-continue': 'off',

    // JSDoc requirements
    'valid-jsdoc': ['error', {
      requireReturn: false,
      requireReturnType: true,
      requireParamDescription: true,
      requireReturnDescription: true
    }],

    'require-jsdoc': ['error', {
      require: {
        FunctionDeclaration: true,
        MethodDefinition: true,
        ClassDeclaration: true,
        ArrowFunctionExpression: false,
        FunctionExpression: false
      }
    }]
  },
  overrides: [
    {
      // Test files
      files: ['**/*.test.js', '**/*.spec.js'],
      rules: {
        'no-console': 'off',
        'max-lines': 'off',
        'require-jsdoc': 'off'
      }
    }
  ]
};