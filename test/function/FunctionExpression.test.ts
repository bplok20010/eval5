import { evaluate, Interpreter } from "../../src";

function deepEqual(a, b) {
	expect(a).toEqual(b);
}

function throws(fn) {
	expect(fn).toThrow();
}

test("declare function -1", () => {
	const a = evaluate(
		`
var ttx=1;
function ttx(name){
  return "hello " + name;
}

ttx

  `
	);

	deepEqual(typeof a, "number");
});

test("declare function -2", () => {
	const a = evaluate(
		`
function ttxr(name){
  return 1;
}
function ttxr(name){
  return 2;
}

ttxr

  `
	);

	deepEqual(a(), 2);
});

test("FunctionExpression-1", () => {
	const testFunc = evaluate(
		`
function test_x1(name){
  return "hello " + name;
}
test_x1;
  `
	);

	deepEqual(true, typeof testFunc === "function");
	deepEqual(testFunc.length, 1);
	deepEqual(testFunc.name, "test_x1");
	deepEqual(testFunc("world"), "hello world");
});

test("FunctionDeclaration-2", () => {
	const testFunc = evaluate(
		`
var func = function(name){
  return "hello " + name;
}

func;
  `
	);

	deepEqual(true, typeof testFunc === "function");
	deepEqual(testFunc.length, 1);
	deepEqual(testFunc.name, "func");
	deepEqual(testFunc("world"), "hello world");
});

test("FunctionDeclaration-name", () => {
	const inst = new Interpreter({}, { ecmaVersion: 6 });
	const person = inst.evaluate(
		`
var person = {
  sayName() {
    console.log('hello!');
  },
};

 person;
  `
	);

	deepEqual(person.sayName.name, "sayName");
});

test("invalid function call", () => {
	throws(() => {
		evaluate(
			`
  const a = 123;
  
   a(); // a is not a function
    `
		);
	});
});

test("object-property function call name", () => {
	throws(() => {
		evaluate(
			`
var obj = {};
obj.a();
    `
		);
	});
});

test("object-property function call name", () => {
	throws(() => {
		evaluate(
			`
var obj = {};
obj["a"]();
    `
		);
	});
});

test("function params should can be overwrite", () => {
	const test = evaluate(
		`
function test_1 (a) {
  a = a || 'hello'
  return a
}

 test_1
    `
	);

	deepEqual(test(), "hello");
});

test("object function scope -1", () => {
	const a = evaluate(
		`
var dx = {
    fy: function fy1() {
        return typeof fy1
    }
};

[typeof fy1, dx.fy, dx.fy()]
    `
	);

	deepEqual(a[0], "undefined");
	deepEqual(a[1].name, "fy1");
	deepEqual(a[2], "function");
});

test("object function scope -2", () => {
	const a = evaluate(
		`
var d = {
    fy: function() {
        return typeof fy
    }
};

[d.fy.name, d.fy()]
    `
	);

	deepEqual(a[0], "fy");
	deepEqual(a[1], "undefined");
});

test("object function scope -3", () => {
	const inst = new Interpreter({}, { ecmaVersion: 6 });
	const a = inst.evaluate(
		`
var d = {
    fy() {
        return typeof fy
    }
};

[d.fy.name, d.fy()]
    `
	);

	deepEqual(a[0], "fy");
	deepEqual(a[1], "undefined");
});

test("function name scope -1", () => {
	const a = evaluate(
		`
var tuh = 1;
var t1 = function(){ return typeof t1 };
tuh = function(){ return typeof tuh };

[t1.name,t1(), tuh()]
    `
	);

	deepEqual(a, ["t1", "function", "function"]);
});

test("function name scope -2", () => {
	const a = evaluate(
		`
var u = 1

var x = function u() { u = 2; return u };

[u, x()]
    `
	);

	deepEqual(a, [1, 2]);
});

test("function call non context", () => {
	const a = evaluate(
		`
        function call_1(){
            return typeof this;
        }
        call_1();
    `
	);

	deepEqual(a, "undefined");
});

test("function call default context", () => {
	Interpreter.globalContextInFunction = "eval5";

	const a = evaluate(
		`
        function call_2(){
            return this;
        }
        call_2();
    `
	);

	Interpreter.globalContextInFunction = void 0;

	deepEqual(a, "eval5");
});

test("function call context", () => {
	Interpreter.globalContextInFunction = "eval5";

	const a = evaluate(
		`
        function call_2(){
            return this;
        }
        call_2();
    `,
		undefined,
		{
			globalContextInFunction: "eval5 context",
		}
	);

	Interpreter.globalContextInFunction = void 0;

	deepEqual(a, "eval5 context");
});

test("function overlap1", () => {
	const ctx: { [x: string]: any } = {};
	ctx.overlap1 = function() {
		return 1;
	};

	const a = evaluate(
		`
        function overlap1(){
            return 2;
        }
        overlap1();
    `,
		ctx
	);

	deepEqual(a, 2);
});

test("function overlap2", () => {
	const a = evaluate(
		`
        var overlap1 = 1;
        function overlap1(){
            return 2;
        }
        typeof overlap1;
    `,
		{}
	);

	deepEqual(a, "number");
});

test("function overlap3", () => {
	var ctx = {};

	evaluate(
		`
        var overlap1 = 1;
    `,
		ctx
	);

	const a = evaluate(
		`
        function overlap1(){
            return 2;
        }
        typeof overlap1;
    `,
		ctx
	);

	deepEqual(a, "function");
});

test("function overlap4", () => {
	var ctx = {};

	const a = evaluate(
		`
      var dat = undefined; 
      function dat() { }

      typeof dat
    `,
		ctx
	);

	deepEqual(a, "undefined");
});

test("function overlap5", () => {
	var ctx = {};

	const a = evaluate(
		`
      var dat; 
      function dat() { }

      typeof dat
    `,
		ctx
	);

	deepEqual(a, "function");
});

test("function overlap5", () => {
	var ctx = {};

	const a = evaluate(
		`
      function dat() {
         function d1(){}    
      }

      typeof d1
    `,
		ctx
	);

	deepEqual(a, "undefined");
});

test("function .call -1", () => {
	const a = evaluate(
		`
        function test(){
            return this;
        }
        test();
    `,
		{}
	);

	deepEqual(a, undefined);
});

test("function .call -2", () => {
	const a = evaluate(
		`
        function test(){
            return  this;
        }
        test.call(100);
    `,
		{}
	);

	deepEqual(a, 100);
});

test("function .call -3", () => {
	const a = evaluate(
		`
        function test(){
            return  this;
        }
        test.bind(100)();
    `,
		{}
	);

	deepEqual(a, 100);
});

test("function .call -4", () => {
	const a = evaluate(
		`
        function test(){
            return  this.o;
        }
        var da = {
            o: true,
            func: test,
        }
        da.func();
    `,
		{}
	);

	deepEqual(a, true);
});

test("function .call -5", () => {
	const a = evaluate(
		`
        function test(){
            return  this;
        }
        var da = {
            o: true,
            func: test,
        };
        (0, da.func)();
    `,
		{}
	);

	deepEqual(a, undefined);
});

test("function toString -1", () => {
	const a = evaluate(
		`
        function test(a,b,c,d){return  this;}

        test
    `,
		{}
	);

	expect(a.toString()).toEqual(`function test(a,b,c,d){return  this;}`);
});

test("function toString -2", () => {
	const interpreter = new Interpreter({});

	const a = interpreter.evaluate(
		`
        function test(a,b,c,d){return  this;}

        test
    `
	);

	interpreter.evaluate(
		`
        test
    `
	);

	expect(a.toString()).toEqual(`function test(a,b,c,d){return  this;}`);
});
