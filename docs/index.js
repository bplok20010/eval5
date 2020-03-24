version.innerHTML = "eval5: " + eval5.Interpreter.version;
var interpreter = new eval5.Interpreter(window);
function run() {
	var source = code.value;

	try {
		var result = interpreter.evaluate(source);
		results.innerHTML = result;
		console.log(result);
	} catch (e) {
		console.log(e);
		results.innerHTML = `<div class="error">${e.message}</div>`;
	}
}
run();
