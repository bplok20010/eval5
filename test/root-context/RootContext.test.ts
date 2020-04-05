import { Interpreter } from "../../src";

test("rootContext -1", () => {
	const rootContext = { a: 1, b: 1, c: 1 };
	const ctx = { a: 2 };
	const interpreter = new Interpreter(ctx, {
		rootContext: rootContext,
	});
	const result = interpreter.evaluate(
		`
    [a,b,c]
    `
	);
	expect(result).toEqual([2, 1, 1]);
});

test("rootContext -2", () => {
	const rootContext: Record<string, any> = { a: 1, b: 1, c: 1 };
	const ctx: Record<string, any> = { a: 2 };
	const interpreter = new Interpreter(ctx, {
		rootContext: rootContext,
	});
	const result = interpreter.evaluate(
		`
    var t = 1;
    y = 2
    `
	);
	expect(ctx.t).toEqual(1);
	expect(ctx.y).toEqual(2);
	expect(rootContext.t).toEqual(undefined);
	expect(rootContext.y).toEqual(undefined);
});

test("rootContext -3", () => {
	const rootContext: Record<string, any> = { a: 1, b: 1, c: 1 };
	const ctx: Record<string, any> = { a: 2 };
	const interpreter = new Interpreter(ctx, {
		rootContext: rootContext,
	});
	const result = interpreter.evaluate(
		`
        delete a;
        delete b;
        [a,b];
    `
	);
	expect(result).toEqual([1, 1]);
});

test("rootContext -4", () => {
	const rootContext: Record<string, any> = { a: 1, b: 1, c: 1, data: { z: 1 } };
	const ctx: Record<string, any> = { a: 2 };
	const interpreter = new Interpreter(ctx, {
		rootContext: rootContext,
	});
	const result = interpreter.evaluate(
		`
        delete eval;
        delete a;
        delete b;
        delete data.z;
        [a,b, data.z, typeof eval];
    `
	);
	expect(result).toEqual([1, 1, undefined, "undefined"]);
});

test("rootContext -5", () => {
	const rootContext: Record<string, any> = { a: 1, b: 1, c: 1, data: { z: 1 } };
	const ctx: Record<string, any> = { a: 2 };
	const interpreter = new Interpreter(ctx, {
		rootContext: rootContext,
	});
	const result = interpreter.evaluate(
		`
        c = 2;
        c;
    `
	);
	expect(result).toEqual(2);
	expect(rootContext.c).toEqual(1);
});
