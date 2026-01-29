module.exports = {
    extends: ['@commitlint/config-conventional'],
    rules: {
        'header-max-length': [2, 'always', 72],
        'subject-case': [2, 'always', 'lower-case'],
        'body-leading-blank': [2, 'always'],
        'body-max-line-length': [2, 'always', 80],
        'footer-leading-blank': [2, 'always'],
        'footer-max-line-length': [2, 'always', 80],
        'type-enum': [
            2,
            'always',
            [
                'feat',
                'perf',
                'fix',
                'revert',
                'style',
                'refac',
                'test',
                'docs',
                'chore',
            ],
        ],
    },
};
