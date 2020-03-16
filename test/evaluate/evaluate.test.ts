import { Interpreter } from "../../src";

test("evaluate result -1", () => {
	const interpreter = new Interpreter();

	const value = interpreter.evaluate(`
        var a = 1;
        a;
    `);

	expect(value).toEqual(1);
});

test("evaluate result -2", () => {
	const interpreter = new Interpreter();

	const ret1 = interpreter.evaluate(`
        var a = 1;
        a;
    `);

	const ret2 = interpreter.evaluate(`
        var b = 1;
    `);

	expect(ret1).toEqual(1);
	expect(ret2).toEqual(undefined);
});

test("evaluate result -3", () => {
	const interpreter = new Interpreter();

	const ret1 = interpreter.evaluate(`
        function fn(){ return 1 };
        fn();
    `);

	const ret2 = interpreter.evaluate(`
        var b = 1;
    `);

	expect(ret1).toEqual(1);
	expect(ret2).toEqual(undefined);
});

test("evaluate result -4", () => {
	const interpreter = new Interpreter({});

	const ret1 = interpreter.evaluate(`
        var a = (function () {
            var b = 1;
            return 2;
        })();
    `);

	expect(ret1).toEqual(undefined);
});
