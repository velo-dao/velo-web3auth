import { includeIgnoreFile } from "@eslint/compat"
import tsParser from "@typescript-eslint/parser"
import canonical from "eslint-config-canonical/configurations/canonical.js"
import json from "eslint-config-canonical/configurations/json.js"
import moduleConfig from "eslint-config-canonical/configurations/module.js"
import prettier from "eslint-config-canonical/configurations/prettier.js"
import typescript from "eslint-config-canonical/configurations/typescript.js"
import eslintPluginPrettierRecommended from "eslint-plugin-prettier/recommended"
import unusedImports from "eslint-plugin-unused-imports"
import { dirname, resolve } from "path"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const gitignorePath = resolve(__dirname, ".gitignore")

export default [
	includeIgnoreFile(gitignorePath),
	canonical.recommended,
	typescript.recommended,
	json.recommended,
	moduleConfig.recommended,
	eslintPluginPrettierRecommended,
	prettier.recommended,
	{
		ignores: [
			"bun.lockb",
			"CHANGELOG.md",
			"README.md",
			"LICENSE",
			".git/",
			"**/.DS_Store",
			"**/*.pem"
		],
		languageOptions: {
			ecmaVersion: "latest",
			parser: tsParser,
			parserOptions: {
				extraFileExtensions: [".json"],
				jsDocParsingMode: "none",
				project: "./tsconfig.eslint.json",
				tsconfigRootDir: __dirname,
				warnOnUnsupportedTypeScriptVersion: false
			},
			sourceType: "module"
		},
		plugins: {
			"unused-imports": unusedImports
		},
		rules: {
			"@typescript-eslint/naming-convention": "off",
			"@typescript-eslint/no-extraneous-class": "off",
			"@typescript-eslint/no-namespace": "off",
			"@typescript-eslint/no-non-null-asserted-optional-chain": "off",
			"@typescript-eslint/no-non-null-assertion": "off",
			"@typescript-eslint/no-unused-vars": "off",
			"canonical/filename-match-exported": "off",
			"canonical/filename-match-regex": "off",
			"canonical/id-match": "off",
			"canonical/import-specifier-newline": "off",
			"eslint-comments/no-unlimited-disable": "off",
			"import/extensions": "off",
			"no-negated-condition": "off",
			"no-warning-comments": "off",
			"node/no-process-env": "off",
			"prettier/prettier": [
				"error",
				{
					bracketSpacing: true,
					jsxSingleQuote: false,
					semi: false,
					singleQuote: false,
					tabWidth: 2,
					trailingComma: "none",
					useTabs: true
				}
			],
			"unicorn/no-abusive-eslint-disable": "off",
			"unicorn/no-empty-file": "off",
			"unicorn/no-static-only-class": "off",
			"unicorn/prevent-abbreviations": "off",
			"unicorn/require-post-message-target-origin": "off",
			"unused-imports/no-unused-imports": "error",
			"unused-imports/no-unused-vars": [
				"warn",
				{
					args: "after-used",
					argsIgnorePattern: "^_",
					vars: "all",
					varsIgnorePattern: "^_"
				}
			]
		}
	}
]
