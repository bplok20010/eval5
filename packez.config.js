module.exports = function(opts) {
	const isProd = opts.program.state === "min";
	return {
		mode: isProd ? "production" : "development",
		clean: isProd ? false : true,
		shouldUseEntryHTML: false,
		polyfills: null,
		shouldUseSourceMap: true,
		output: {
			globalObject: "this",
			libraryTarget: "umd",
			library: "eval5",
		},
		assest: {
			js: {
				name: isProd ? "eval5.min.js" : "eval5.js",
				output: "",
			},
		},
		// target: "node",
		optimization: {
			runtimeChunk: false,
			splitChunks: false,
		},
		babel: {
			useBuiltIns: false,
			modules: "cjs",
		},
	};
};
