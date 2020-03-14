const { evaluate, Interpreter } = require("../../src");

test("eval basic-1", () => {
	const ctx = Object.create(null);
	const a = evaluate(
		`
    var a = 100;
    var b = 200;
    eval('a+b');
    `,
		ctx
	);
	expect(a).toEqual(300);
});

test("eval basic-2", () => {
	const ctx = Object.create(null);
	const a = evaluate(
		`
    var x = 10, y = 20;
    var xeval = eval;
    function test() {
            var x = 2,
                y = 4;
            var geval = eval;
            return [xeval("x + y"), eval("x + y"), geval("x + y"), (0, eval)("x + y")];
    }
    test();
    `,
		ctx
	);
	expect(a).toEqual([30, 6, 30, 30]);
});

test("eval alias name", () => {
	const ctx = Object.create(null);
	const a = evaluate(
		`
        function test() {
            var x = 2;
            var geval = eval;
            return [geval("typeof x"), (0, eval)("typeof x")];
        }
        test();
    `,
		ctx
	);
	expect(a).toEqual(["undefined", "undefined"]);
});

test("eval with global.eval", () => {
	const ctx = Object.create(global);
	const a = evaluate(
		`
        function test() {
            var xct = 2;
            return [eval("typeof xct"), (0, eval)("typeof xct")];
        }
        test();
    `,
		ctx
	);
	expect(a).toEqual(["undefined", "undefined"]);
});

test("Interpreter.eval", () => {
	const ctx = Object.create(global);
	ctx.eval = Interpreter.eval;
	const a = evaluate(
		`
        function test() {
            var xct = 2;
            return [eval("typeof xct"), (0, eval)("typeof xct")];
        }
        test();
    `,
		ctx
	);
	expect(a).toEqual(["number", "undefined"]);
});
test("use global.Function", () => {
	const ctx = Object.create(global);
	const a = evaluate(
		`
        var func = new Function('a','b', 'return a+b');
        [func(100,200),Function.__IS_FUNCTION_FUNC]
    `,
		ctx
	);
	expect(a).toEqual([300, undefined]);
});
test("Interpreter.Function", () => {
	const ctx = Object.create(global);
	ctx.Function = Interpreter.Function;
	const a = evaluate(
		`
        var func = new Function('a','b', 'return a+b');
        [func(100,200),Function.__IS_FUNCTION_FUNC]
    `,
		ctx
	);
	expect(a).toEqual([300, true]);
});

test("eval basic-2", () => {
	const ctx = Object.create({
		console,
	});
	const a = evaluate(
		`
    var a = 100;    
    function test(){
        var b = 200;
        return eval('a+b+this');
    } 
    test.call(300);
    `,
		ctx
	);
	expect(a).toEqual(600);
});

test("eval basic-3", () => {
	let message = "";
	try {
		evaluate(
			`
        new eval('1+1')
        `
		);
	} catch (e) {
		message = e.message;
	}
	expect(message).toEqual("eval is not a constructor [2:8]");
});

test("Function basic -1", () => {
	const ctx = Object.create(null);
	const a = evaluate(
		`
    var func = new Function('a', 'b', 'return a+b');
    
    [func(100,200), func];
    `,
		ctx
	);
	expect(a[0]).toEqual(300);
	expect(a[1](200, 300)).toEqual(500);
});

test("Function basic -2", () => {
	const ctx = Object.create(null);
	const a = evaluate(
		`
    var func = Function('a', 'b', 'return a+b');
    
    [func(100,200), func];
    `,
		ctx
	);
	expect(a[0]).toEqual(300);
	expect(a[1](200, 300)).toEqual(500);
});

test("global object", () => {
	const ctx = Object.create(null);
	const a = evaluate(
		`
    [  eval,  Function,
        NaN,
        Infinity,
        undefined,
        Object,
        Array,
        String,
        Boolean,
        Number,
        Date,
        RegExp,
        Error,
        TypeError,
        Math,
        parseInt,
        parseFloat,
        isNaN,
        isFinite,
        decodeURI,
        decodeURIComponent,
        encodeURI,
        encodeURIComponent,
        escape,
        unescape,
        JSON
    ]
    `,
		ctx
	);
	expect(a).toEqual([
		Interpreter.eval,
		Interpreter.Function,
		NaN,
		Infinity,
		undefined,
		Object,
		Array,
		String,
		Boolean,
		Number,
		Date,
		RegExp,
		Error,
		TypeError,
		Math,
		parseInt,
		parseFloat,
		isNaN,
		isFinite,
		decodeURI,
		decodeURIComponent,
		encodeURI,
		encodeURIComponent,
		escape,
		unescape,
		JSON,
	]);
});

test("delete global prop -1", () => {
	const ctx = {
		JSON,
	};
	const a = evaluate(
		`
    delete JSON;
    typeof JSON;
    `,
		ctx
	);
	expect(a).toEqual("undefined");
});

test("delete global prop -2", () => {
	const O_JSON = global.JSON;
	const JSON_ = {} as JSON;
	global.JSON = JSON_;
	const ctx = global;
	const a1 = evaluate(`delete JSON; typeof JSON;`, ctx);
	const a2 = evaluate(
		`
     JSON;
    `,
		ctx
	);
	expect([a1, a2]).toEqual(["undefined", O_JSON]);

	global.JSON = O_JSON;
});

test("replace super scope prop", () => {
	const ctx = Object.create({
		Map: 1,
	});
	ctx.Set = 2;
	ctx.Promise = 3;
	const a = evaluate(
		`
    delete Map;
    delete Promise;
    [Map, Set, typeof Promise]
    `,
		ctx
	);
	expect(a).toEqual([1, 2, "undefined"]);
});

test("replace super scope prop", () => {
	const ctx = Object.create(null);
	evaluate(`d = 1`, ctx);
	expect(ctx).toEqual({ d: 1 });
});

test("call Interpreter.eval", () => {
	let msg = "";
	try {
		Interpreter.eval("1+1");
	} catch (e) {
		msg = e.message;
	}

	expect(msg).toEqual("Illegal call");
});

test("call Interpreter.Function", () => {
	let msg = "";
	try {
		Interpreter.Function("a", "b", "c");
	} catch (e) {
		msg = e.message;
	}

	expect(msg).toEqual("Illegal call");
});
