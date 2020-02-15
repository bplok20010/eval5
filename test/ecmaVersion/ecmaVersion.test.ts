import { Interpreter } from "../../src";

test("es3", () => {
	let hasError = false;
	const interpreter = new Interpreter(
		{},
		{
			ecmaVersion: 3,
		}
	);
	try {
		interpreter.evaluate(
			`
        var data = {
            _value: 4,
            get value(){
                return this._value;
            }
        }
  `
		);
	} catch (e) {
		hasError = true;
	}

	expect(hasError).toEqual(true);
});

test("es5 -1", () => {
	let hasError = false;
	const interpreter = new Interpreter(
		{},
		{
			ecmaVersion: 5,
		}
	);
	try {
		interpreter.evaluate(
			`
        var data = {
            _value: 4,
            get value(){
                return this._value;
            }
        }
  `
		);
	} catch (e) {
		hasError = true;
	}

	expect(hasError).toEqual(false);
});

test("es5 -2", () => {
	let hasError = false;
	const interpreter = new Interpreter(
		{},
		{
			ecmaVersion: 5,
		}
	);
	try {
		interpreter.evaluate(
			`
        let i = 1;
  `
		);
	} catch (e) {
		hasError = true;
	}

	expect(hasError).toEqual(true);
});
