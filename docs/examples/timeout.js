version.innerHTML = "version: " + eval5.Interpreter.version;
var interpreter = new eval5.Interpreter(window, {
	timeout: 1000,
});
function run() {
	try {
		var result = interpreter.evaluate(code.value);
		results.innerHTML = result;
		console.log(result);
	} catch (e) {
		console.log(e);
		results.innerHTML = '<div class="error">' + e.message + "</div>";
	}
	runBtn.disabled = false;
}

function startRun() {
	runBtn.disabled = true;
	results.innerHTML = "parsing...";
	setTimeout(run, 10);
}
main();
function main() {
	code.value = `
while(1){}
              `;

	startRun();
}
