const { evaluate } = require("../../lib");

function deepEqual(a, b) {
	expect(a).toEqual(b);
}

function throws(fn) {
	expect(fn).toThrow();
}

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
	const person = evaluate(
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
