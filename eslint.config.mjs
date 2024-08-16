import tsParser from "@typescript-eslint/parser";
import canonical from 'eslint-config-canonical/configurations/canonical.js';
import typescript from 'eslint-config-canonical/configurations/typescript.js';
import json from 'eslint-config-canonical/configurations/json.js';
import module from 'eslint-config-canonical/configurations/module.js';
import typescriptTypeChecking from 'eslint-config-canonical/configurations/typescript-type-checking.js';
import prettier from 'eslint-config-canonical/configurations/prettier.js';

export default [
	canonical,
	typescript,
	json,
	module,
	typescriptTypeChecking,
	prettier,
	{
        ignores: [
            "**/package.json",
            "**/tsconfig.json",
            "node_modules",
            "bun.lockb",
            "**/CHANGELOG.md",
            "**/README.md",
            ".git/",
            "**/*.tsbuildinfo",
            "**/.DS_Store",
            "**/*.pem",
        ],
        languageOptions: {
            parser: tsParser,
            ecmaVersion: "latest",
            sourceType: "script",
            parserOptions: {
                project: "./tsconfig.json",
            },
        },
        rules: {
            "prettier/prettier": ["error", {
                singleQuote: false,
                semi: false,
                useTabs: true,
                trailingComma: "none",
                tabWidth: 2,
                jsxSingleQuote: false,
                bracketSpacing: true,
            }],
            "node/no-process-env": "off",
            "import/extensions": "off",
            "no-warning-comments": "off",
            "@typescript-eslint/no-non-null-assertion": "off",
            "@typescript-eslint/no-non-null-asserted-optional-chain": "off",
            "react/jsx-sort-props": "off",
            "@typescript-eslint/no-unused-vars": "error",
            "canonical/destructuring-property-newline": "off",
            "canonical/import-specifier-newline": "off",
            "canonical/filename-match-exported": "off",
            "canonical/filename-match-regex": "off",
            "unicorn/no-abusive-eslint-disable": "off",
            "eslint-comments/no-unlimited-disable": "off",
            "unicorn/no-empty-file": "off",
        },
    }
];