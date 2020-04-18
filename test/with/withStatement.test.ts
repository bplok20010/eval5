import { evaluate, Interpreter } from "../../src";

function deepEqual(a, b) {
	expect(a).toEqual(b);
}

test("with1", () => {
	const a = evaluate(`
    var a1 = 1;
    var obj = {
        a1 :2
    }
with(obj){
    a1
}
    `);

	deepEqual(a, 2);
});

test("with2", () => {
	const a = evaluate(`
    function o1(){}
 o1.prototype.x = 100;
 var z = new o1();

 with(z) {
     x
 }
    `);

	deepEqual(a, 100);
});

test("with3", () => {
	var ctx: Record<string, any> = {};
	const result = evaluate(
		`

    var obj = {}

    with(obj) {
        a = 10
    }

    obj.a

    `,
		ctx
	);

	expect(result).toEqual(undefined);
	expect(ctx.a).toEqual(10);
});

test("with4", () => {
	var ctx: Record<string, any> = {};
	const result = evaluate(
		`

    var obj = {
        a: 10
    }

    with(obj) {
        a = 20
    }

    obj.a

    `,
		ctx
	);

	expect(result).toEqual(20);
});

test("with5", () => {
	var ctx: Record<string, any> = {};
	const result = evaluate(
		`

    var obj = {
        a: 10
    }

    with(obj) {
        var a = 20
    }

    obj.a

    `,
		ctx
	);

	expect(result).toEqual(20);
});

test("with6", () => {
	var ctx: Record<string, any> = {};
	const result = evaluate(
		`

    var obj = {
        a: 10
    }

    with(obj) {
        var b = 20
    }

    b

    `,
		ctx
	);

	expect(result).toEqual(20);
});

test("with7", () => {
	var ctx: Record<string, any> = {};
	const interpreter = new Interpreter(ctx);
	try {
		interpreter.evaluate(
			`
    var obj = {
        a: 10
    }
    with(obj) {
        //throw error
        u.a = 1;
    }

    obj

    `
		);
	} catch (e) {}

	const result = interpreter.evaluate(`
    var b = 1;
    obj;
    `);

	expect(ctx.obj.a).toEqual(10);
	expect(result.b).toEqual(undefined);
	expect(ctx.b).toEqual(1);
});

test("with8", () => {
	var ctx: Record<string, any> = {};
	const interpreter = new Interpreter(ctx);
	try {
		interpreter.evaluate(
			`
    var obj = {
        a: 10
    }
    function abc() {
        //throw error
        u.a = 1;
    }

    abc.call(obj);

    `
		);
	} catch (e) {}

	const result = interpreter.evaluate(`
    var b = 1;
    obj;
    `);

	expect(ctx.obj.a).toEqual(10);
	expect(ctx.b).toEqual(1);
	expect(result.b).toEqual(undefined);
	expect(result.a).toEqual(10);
});

test("with9", () => {
	var ctx: Record<string, any> = {};
	const result = evaluate(
		`
    var obj = {
        a: 10,
        f1: function(){
            return this;
        },
        f2: function(){
            return this.a;
        }
    }

    with(obj) {
        var f = f1;
        [f(),(0,f1)(),f2()]
    }
    `,
		ctx
	);

	expect(result).toEqual([undefined, undefined, 10]);
});

test("with10", () => {
	var ctx: Record<string, any> = {};
	const result = evaluate(
		`
    var obj = {
        a: 10,
        f1: function(){
            return this;
        },
        f2: function(){
            return this.a;
        }
    }
    var obj2 = {
        a: 11,
        f3: function(){
            return this;
        },
        f4: function(){
            return this.a;
        }
    }


    with(obj) {
        with(obj2) {
            var f = f1;
            [f(),(0,f1)(),f2(), f4(), (0,f3)()]
        }
    }
    `,
		ctx
	);

	expect(result).toEqual([undefined, undefined, 10, 11, undefined]);
});
