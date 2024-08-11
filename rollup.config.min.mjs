import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import { terser } from "rollup-plugin-terser";

export default {
	input: "dist/cjs/umd.js",
	output: {
		format: "umd",
		file: "./umd/eval5.min.js",
		name: "eval5",
	},
	plugins: [commonjs(), resolve(), terser()],
};
