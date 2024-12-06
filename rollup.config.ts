import commonjs from "@rollup/plugin-commonjs"
import json from "@rollup/plugin-json"
import resolve from "@rollup/plugin-node-resolve"
import terser from "@rollup/plugin-terser"
import typescript from "@rollup/plugin-typescript"
import { defineConfig } from "rollup"

const isProduction = process.env.NODE_ENV === "production"

const esmTypescript = typescript({
	module: "esnext",
	sourceMap: false,
	tsconfig: "./tsconfig.json"
})

const cjsTypescript = typescript({
	declaration: false,
	module: "esnext",
	sourceMap: false,
	tsconfig: "./tsconfig.cjs.json"
})

const config = defineConfig([
	{
		input: "src/index.ts",
		onwarn(warning, warn) {
			// Ignore circular dependency warnings from node_modules
			if (
				warning.code === "CIRCULAR_DEPENDENCY" &&
				warning.message.includes("node_modules")
			) {
				return
			}

			if (warning.code === "EVAL" && warning.message.includes("node_modules")) {
				return
			}

			warn(warning)
		},
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
			sourcemap: false
		},
		plugins: [
			resolve({
				extensions: [".js", ".ts", ".json"],
				preferBuiltins: true
			}),
			commonjs(),
			esmTypescript,
			json(),
			isProduction && terser()
		].filter(Boolean)
	},
	{
		input: "src/index.ts",
		onwarn(warning, warn) {
			// Ignore circular dependency warnings from node_modules
			if (
				warning.code === "CIRCULAR_DEPENDENCY" &&
				warning.message.includes("node_modules")
			) {
				return
			}

			if (warning.code === "EVAL" && warning.message.includes("node_modules")) {
				return
			}

			warn(warning)
		},
		output: {
			dir: "dist/cjs",
			exports: "named",
			format: "cjs",
			preserveModules: false,
			sourcemap: false
		},
		plugins: [
			resolve({
				extensions: [".js", ".ts", ".json"],
				preferBuiltins: true
			}),
			commonjs(),
			cjsTypescript,
			json(),
			isProduction && terser()
		].filter(Boolean)
	}
])

export default config
