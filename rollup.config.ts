import commonjs from "@rollup/plugin-commonjs"
import json from "@rollup/plugin-json"
import resolve from "@rollup/plugin-node-resolve"
import terser from "@rollup/plugin-terser"
import typescript from "@rollup/plugin-typescript"
import { defineConfig } from "rollup"

const isProduction = process.env.NODE_ENV === "production"

const esmTypescript = typescript({
	declarationDir: "dist/esm/types",
	inlineSources: !isProduction,
	module: "esnext",
	outDir: "dist/esm",
	sourceMap: true,
	tsconfig: "./tsconfig.esm.json"
})

const cjsTypescript = typescript({
	declaration: true,
	declarationDir: "dist/cjs/types",
	inlineSources: !isProduction,
	module: "esnext",
	outDir: "dist/cjs",
	sourceMap: true,
	tsconfig: "./tsconfig.cjs.json"
})

const config = defineConfig([
	{
		input: "src/index.ts",
		output: {
			dir: "dist/esm",
			exports: "named",
			format: "esm",
			paths: (id) => {
				if (id.startsWith("./") || id.startsWith("../")) {
					return id + ".js"
				}

				return id
			},
			preserveModules: true,
			preserveModulesRoot: "src",
			sourcemap: true
		},
		plugins: [
			resolve({
				extensions: [".js", ".ts", ".json"]
			}),
			commonjs(),
			esmTypescript,
			json(),
			isProduction && terser()
		].filter(Boolean)
	},
	{
		input: "src/index.ts",
		output: {
			dir: "dist/cjs",
			exports: "named",
			format: "cjs",
			preserveModules: false,
			sourcemap: true
		},
		plugins: [
			resolve({
				extensions: [".js", ".ts", ".json"]
			}),
			commonjs(),
			cjsTypescript,
			json(),
			isProduction && terser()
		].filter(Boolean)
	}
])

export default config
