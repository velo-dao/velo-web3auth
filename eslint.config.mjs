/* eslint-disable canonical/id-match */
import tsParser from "@typescript-eslint/parser"
import browser from "eslint-config-canonical/configurations/browser.js"
import canonical from "eslint-config-canonical/configurations/canonical.js"
import json from "eslint-config-canonical/configurations/json.js"
import moduleConfig from "eslint-config-canonical/configurations/module.js"
import prettier from "eslint-config-canonical/configurations/prettier.js"
import regexp from "eslint-config-canonical/configurations/regexp.js"
import typescript from "eslint-config-canonical/configurations/typescript.js"
import zod from "eslint-config-canonical/configurations/zod.js"
import eslintPluginPrettier from "eslint-plugin-prettier"
import tsPlugin from "@typescript-eslint/eslint-plugin"
import unusedImports from "eslint-plugin-unused-imports"
import { dirname } from "path"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export default [
	canonical.recommended,
	typescript.recommended,
	json.recommended,
	moduleConfig.recommended,
	regexp.recommended,
	zod.recommended,
	browser.recommended,
	prettier.recommended,
	{
		ignores: [
			"bun.lockb",
			"**/CHANGELOG.md",
			"**/README.md",
			"public/*",
			".git/",
			".husky/",
			"**/*.tsbuildinfo",
			"**/.DS_Store",
			"**/*.pem",
			"app/theme/components/styled/utils/*"
		]
	},
	{
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
			prettier: eslintPluginPrettier,
			typescript: tsPlugin,
			"unused-imports": unusedImports
		},
		rules: {
			"@stylistic/no-mixed-spaces-and-tabs": "off",
			"@stylistic/no-tabs": "off",
			"@stylistic/semi": "off",
			"@typescript-eslint/no-namespace": "off",
			"@typescript-eslint/no-non-null-asserted-optional-chain": "off",
			"@typescript-eslint/no-non-null-assertion": "off",
			"@typescript-eslint/no-redeclare": "off",
			"@typescript-eslint/consistent-type-imports": ["error", {
				disallowTypeAnnotations: false,
				prefer: 'type-imports',
  			}],
			// "import/extensions": ["error", "ignorePackages", {
			// 	"": "never",
			// 	"js": "always",
			// 	"ts": "never",
			// }],
			"@typescript-eslint/naming-convention": "off",
			"canonical/destructuring-property-newline": "off",
			"canonical/filename-match-exported": "off",
			"canonical/filename-match-regex": "off",
			"canonical/import-specifier-newline": "off",
			"eslint-comments/no-unlimited-disable": "off",
			"id-length": "off",
			"import/extensions": "off",
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
			"unused-imports/no-unused-imports": "error",
			"unused-imports/no-unused-vars": "off",
			"canonical/id-match": "off",
			"@typescript-eslint/no-useless-constructor": "off",
		},
	}
]
