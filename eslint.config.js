import promise from 'eslint-plugin-promise';
import prettier from 'eslint-plugin-prettier';
import tseslint from 'typescript-eslint';
import importXPlugin from 'eslint-plugin-import-x';
import eslint from '@eslint/js';

export default tseslint.config(
  {
    ignores: ['**/node_modules', '**/dist', 'eslint.config.js'],
  },
  {
    files: ['src/**/*.ts'],
    plugins: {
      'import-x': importXPlugin,
      promise,
      prettier,
    },

    extends: [eslint.configs.recommended, ...tseslint.configs.recommended],

    languageOptions: {
      ecmaVersion: 2020,
      sourceType: 'module',

      parserOptions: {
        project: './tsconfig.json',
        createDefaultProgram: true,
      },
    },

    rules: {
      'no-console': 'off',
      'max-len': 'off',
      'no-await-in-loop': 'off',

      'import-x/no-extraneous-dependencies': [
        'error',
        {
          devDependencies: true,
        },
      ],

      'import-x/prefer-default-export': 'off',

      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],

      '@typescript-eslint/no-empty-object-type': 'off',
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      'no-nested-ternary': 'off',
      'no-async-promise-executor': 'error',
      'no-continue': 'off',
      'promise/always-return': 'off',
      'promise/no-return-wrap': 'error',
      'promise/param-names': 'error',
      'promise/catch-or-return': 'error',
      'promise/no-native': 'off',
      'promise/no-nesting': 'off',
      'promise/no-promise-in-callback': 'off',
      'promise/no-callback-in-promise': 'off',
      'promise/avoid-new': 'off',
      'promise/no-new-statics': 'error',
      'promise/no-return-in-finally': 'warn',
      'promise/valid-params': 'warn',
      'no-bitwise': 'off',
      'no-underscore-dangle': 'off',
      'no-throw-literal': 'off',
      'no-case-declarations': 'off',
      'function-paren-newline': 'off',
      'default-param-last': 'off',
      complexity: 'off',
      'no-useless-return': 'off',
      'no-empty': 'off',

      'no-restricted-syntax': [
        'error',
        {
          selector: 'ForInStatement',
          message:
            'for..in loops iterate over the entire prototype chain, which is virtually never what you want. Use Object.{keys,values,entries}, and iterate over the resulting array.',
        },
        {
          selector: 'LabeledStatement',
          message:
            'Labels are a form of GOTO; using them makes code confusing and hard to maintain and understand.',
        },
        {
          selector: 'WithStatement',
          message:
            '`with` is disallowed in strict mode because it makes code impossible to predict and optimize.',
        },
      ],
    },
  }
);
