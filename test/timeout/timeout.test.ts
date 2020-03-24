import { Interpreter } from "../../src";

test("timeout -1", () => {
	let hasError = false;
	let msg = "";
	const interpreter = new Interpreter(
		{},
		{
			timeout: 500,
		}
	);
	try {
		interpreter.evaluate(
			`
function test(){
    var t = 0;
    for(;;) { 
        t++;
    }
}

test();

  `
		);
	} catch (e) {
		msg = e.message;
		hasError = true;
	}

	expect(interpreter.getExecutionTime() < 600).toEqual(true);

	expect(msg).toEqual("Script execution timed out after 500ms");
	expect(hasError).toEqual(true);

	//again
	var _s = Date.now();
	var _e = Date.now();
	try {
		interpreter.evaluate(
			`
function test(){
    var t = 0;
    for(;;) { 
        t++;
    }
}

test();

  `
		);
	} catch (e) {
		_e = Date.now();
	}

	expect(_e - _s > 400).toBe(true);
});

test("timeout -2", () => {
	let hasError = false;
	let msg = "";
	let result: boolean;

	const interpreter = new Interpreter(
		{},
		{
			timeout: 500,
		}
	);

	const fn = interpreter.evaluate(
		`
function test(num){
    var start = Date.now();
    
    for(;;) {
        var current = Date.now(); 
        if( current - start > 1000 ) {
            return true;
        }
    }

    return false;
}

test;

  `
	);

	try {
		result = fn();
	} catch (e) {
		msg = e.message;
		hasError = true;
	}

	expect(msg).toEqual("");
	expect(result).toEqual(true);
	expect(hasError).toEqual(false);
});
