import eslint from '@eslint/js';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import reactPlugin from 'eslint-plugin-react';

export default tseslint.config(
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/cdk.out/**',
      '**/.venv/**'
    ]
  },
  eslint.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  eslintPluginPrettierRecommended,
  reactPlugin.configs.flat.recommended,
  reactPlugin.configs.flat['jsx-runtime'],
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.browser
      },
      parserOptions: {
        ecmaVersion: 'latest',
        projectService: true,
        project: [
          './tsconfig.json',
          'backend/tsconfig.json',
          'shared/tsconfig.json',
          'web-app/tsconfig.json'
        ],
        sourceType: 'module',
        tsconfigRootDir: import.meta.dirname
      }
    },
    settings: { react: { version: 'detect', defaultVersion: '18' } },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh
    },
    rules: {
      'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'warn',
      'prettier/prettier': ['warn'],
      'consistent-return': ['error'],
      quotes: [
        'error',
        'single',
        {
          avoidEscape: true,
          allowTemplateLiterals: false
        }
      ],
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-inferrable-types': 'off',
      '@typescript-eslint/no-unnecessary-condition': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unnecessary-type-parameters': 'off',
      '@typescript-eslint/use-unknown-in-catch-callback-variable': 'off',
      '@typescript-eslint/consistent-type-imports': [
        'error',
        {
          prefer: 'type-imports',
          fixStyle: 'inline-type-imports',
          disallowTypeAnnotations: true
        }
      ],
      '@typescript-eslint/no-confusing-void-expression': [
        'error',
        {
          ignoreArrowShorthand: true
        }
      ],
      '@typescript-eslint/restrict-template-expressions': [
        'error',
        {
          allowNumber: true
        }
      ],
      '@typescript-eslint/explicit-function-return-type': [
        'error',
        {
          allowExpressions: false,
          allowTypedFunctionExpressions: false,
          allowHigherOrderFunctions: false,
          allowConciseArrowFunctionExpressionsStartingWithVoid: false
        }
      ],
      '@typescript-eslint/typedef': [
        'error',
        {
          arrayDestructuring: true,
          arrowParameter: true,
          memberVariableDeclaration: true,
          objectDestructuring: true,
          parameter: true,
          propertyDeclaration: true,
          variableDeclaration: true
        }
      ],
      '@typescript-eslint/no-floating-promises': [
        'error',
        {
          ignoreVoid: false,
          ignoreIIFE: false
        }
      ]
    }
  },
  {
    files: ['**/*.mjs', '**/*.cjs', '**/*.js', '**/*.jsx'],
    ...tseslint.configs.disableTypeChecked,
    rules: {
      ...tseslint.configs.disableTypeChecked.rules,
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/typedef': 'off'
    }
  }
);
