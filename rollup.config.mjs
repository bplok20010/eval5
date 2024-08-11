import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";

export default {
	input: "dist/cjs/umd.js",
	output: {
		format: "umd",
		file: "./umd/eval5.js",
		name: "eval5",
	},
	plugins: [commonjs(), resolve()],
};
