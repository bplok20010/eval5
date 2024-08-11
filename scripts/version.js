const fs = require("fs-extra");
const pkg = require("../package.json");

function main() {
	const cjsFile = "./dist/cjs/interpreter/main.js";
	const esmFile = "./dist/esm/interpreter/main.js";
	let code1 = fs.readFileSync(cjsFile).toString();
	code1 = code1.replace(/%VERSION%/g, pkg.version);
	fs.writeFileSync(cjsFile, code1);

	let code2 = fs.readFileSync(esmFile).toString();
	code2 = code2.replace(/%VERSION%/g, pkg.version);
	fs.writeFileSync(esmFile, code2);
}

if (require.main === module) {
	main();
}
