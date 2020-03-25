var eval5LibUrl = "../umd/eval5.min.js";
var demoCode = "./self-interpreter-demo-code.js";
version.innerHTML = "version: " + eval5.Interpreter.version;
var interpreter = new eval5.Interpreter({});
var _init = false;
function run() {
	try {
		!_init && interpreter.evaluate(lib.value);
		_init = true;

		var result = interpreter.evaluate(code.value);
		results.innerHTML = result;
		console.log(result);
	} catch (e) {
		console.log(e);
		results.innerHTML = '<div class="error">' + e.message + "</div>";
	}
}

function startRun() {
	results.innerHTML = "parsing...";
	setTimeout(run, 10);
}
main();
function main() {
	results.innerHTML = "loading...";
	runBtn.disabled = true;

	var p1 = fetch(eval5LibUrl).then(res => res.text());
	var p2 = fetch(demoCode).then(res => res.text());

	Promise.all([p1, p2]).then(([Vue, demoCode]) => {
		var s = `
${Vue}
        `;

		runBtn.disabled = false;

		lib.value = s;
		code.value = demoCode;

		startRun();
	});
}
