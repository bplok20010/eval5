const pkg = require("./package.json");

module.exports = api => {
	const isTest = api.env("test"); //jest

	return {
		presets: [
			[
				"babel-preset-packez",
				{
					modules: "cjs",
					loose: true,
				},
			],
		],
		plugins: [
			[
				"search-and-replace",
				{
					rules: [
						{
							search: "%VERSION%",
							replace: pkg.version,
						},
					],
				},
			],
		],
	};
};
