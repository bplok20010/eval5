var reactLibUrl = "https://cdn.jsdelivr.net/npm/react@16.13.1/umd/react.production.min.js";
var reactDOMLibUrl =
	"https://cdn.jsdelivr.net/npm/react-dom@16.13.1/umd/react-dom.production.min.js";
var demoCode = "./react-demo-code.js";
version.innerHTML = "version: " + eval5.Interpreter.version;
var interpreter = new eval5.Interpreter(window);
var _init = false;
function run() {
	try {
		!_init && interpreter.evaluate(lib.value);
		_init = true;

		var result = interpreter.evaluate(code.value);
		results.innerHTML = "complete";
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

	var p1 = fetch(reactLibUrl).then(res => res.text());
	var p2 = fetch(reactDOMLibUrl).then(res => res.text());
	var p3 = fetch(demoCode).then(res => res.text());

	Promise.all([p1, p2, p3]).then(([React, ReactDOM, demoCode]) => {
		var s = `
${React}
${ReactDOM}
        `;

		runBtn.disabled = false;

		lib.value = s;
		code.value = demoCode;

		startRun();
	});
}
