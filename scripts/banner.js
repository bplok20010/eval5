const fs = require("fs-extra");
const pkg = require("../package.json");

exports.getBannerTemplate = function () {
	return `/*!
 * @license ${pkg.name} v${pkg.version}
 * Copyright (c) 2019-2020 nobo (MIT Licensed)
 * https://github.com/bplok20010/eval5
 */`;
};

function main() {
	const data = fs.readFileSync("./umd/eval5.min.js");
	fs.writeFileSync("./umd/eval5.min.js", exports.getBannerTemplate() + "\n" + data);
}

if (require.main === module) {
	main();
}
