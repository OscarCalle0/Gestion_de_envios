import tsEslintPlugin from '@typescript-eslint/eslint-plugin';
import parser from '@typescript-eslint/parser';
import prettierPlugin from 'eslint-plugin-prettier';

export default [
    {
        files: ['src/**/*.ts'],
        ignores: ['dist/**/*', 'node_modules/**/*'],
        languageOptions: {
            parser,
            parserOptions: {
                ecmaVersion: 'latest',
                sourceType: 'module',
            },
        },
        plugins: {
            '@typescript-eslint': tsEslintPlugin,
            prettier: prettierPlugin,
        },
        rules: {
            '@typescript-eslint/no-dynamic-delete': 'error',
            '@typescript-eslint/no-require-imports': 'error',
            '@typescript-eslint/no-explicit-any': 'warn',
            '@typescript-eslint/no-unused-vars': [
                'error',
                {
                    argsIgnorePattern: '^_',
                    ignoreRestSiblings: true,
                },
            ],
            indent: [
                'error',
                4,
                {
                    SwitchCase: 1,
                },
            ],
            'linebreak-style': ['error', 'unix'],
            'comma-spacing': [
                'error',
                {
                    before: false,
                    after: true,
                },
            ],
            'no-multi-spaces': 'error',
            'no-trailing-spaces': 'error',
            quotes: [
                'error',
                'single',
                {
                    allowTemplateLiterals: true,
                },
            ],
            'one-var': ['error', 'never'],
            'no-unreachable': 'error',
            'no-unused-vars': 'off',
            'no-return-await': 'error',
            'no-eq-null': 'error',
            eqeqeq: 'error',
            'no-else-return': 'error',
            'no-self-compare': 'error',
            'max-params': ['error', 4],
            'default-param-last': ['error'],
            'no-delete-var': 'error',
        },
        settings: {
            prettier: true,
        },
    },
];
