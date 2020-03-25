import { evaluate } from "../../src";

function deepEqual(a, b) {
	expect(a).toEqual(b);
}

test("typeof", () => {
	const type = evaluate(
		`
 typeof 123;
  `
	);

	deepEqual(type, "number");
});

test("typeof before defined", () => {
	const type = evaluate(
		`

 typeof a; // a is not defined, it should equal 'undefined'
  `
	);

	deepEqual(type, "undefined");
});

test("typeof before var", () => {
	const type = evaluate(
		`

 typeof a;
var a;
  `
	);

	deepEqual(type, "undefined");
});

test("void", () => {
	const type = evaluate(
		`
 void 123;
  `
	);

	deepEqual(type, undefined);
});

test("delete", () => {
	const obj = evaluate(
		`
var obj = {
  a: 123
};

delete obj.a;

 obj;
  `
	);

	deepEqual(obj.a, undefined);
	deepEqual(Object.keys(obj).length, 0);
});

test("!", () => {
	const isTrue = evaluate(
		`
var isTrue = !false;

 isTrue;
  `
	);
	deepEqual(true, isTrue);
});

test("+", () => {
	const num = evaluate(
		`
var num = +("123");

 num;
  `
	);
	deepEqual(num, 123);
});

test("-", () => {
	const num = evaluate(
		`
var num = -("123");

 num;
  `
	);
	deepEqual(num, -123);
});

test("~", () => {
	const num = evaluate(
		`
var num = ~("123");

 num;
  `
	);
	deepEqual(num, -124);
});

test("getter trigger", () => {
	const v = evaluate(
		`
var triggerCount = 0;
var data = {
    get value(){
        triggerCount++
        return 1;
    }
};

-data.value;

+data.value;

!data.value;

~data.value;

void data.value;

typeof data.value;

delete data.value

triggerCount
  `
	);
	expect(v).toBe(6);
});
