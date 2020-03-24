var vueLibUrl = "https://cdn.jsdelivr.net/npm/vue";
var demoCode = "./vue-demo-code.js";
version.innerHTML = "version: " + eval5.Interpreter.version;
var interpreter = new eval5.Interpreter(window);
function run() {
	try {
		interpreter.evaluate(lib.value);
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

	var p1 = fetch(vueLibUrl).then(res => res.text());
	var p2 = fetch(demoCode).then(res => res.text());

	Promise.all([p1, p2]).then(([Vue, demoCode]) => {
		const s = `
${Vue}
        `;

		runBtn.disabled = false;

		lib.value = s;
		code.value = demoCode;

		startRun();
	});
}
