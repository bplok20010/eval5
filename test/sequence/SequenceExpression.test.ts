import { evaluate } from "../../src";

function deepEqual(a, b) {
	expect(a).toEqual(b);
}

test("basic", () => {
	const a = evaluate(
		`
var a = (1 , 2);

 a;
  `
	);
	deepEqual(a, 2);
});

test("with call expression", () => {
	const { a, b } = evaluate(
		`
var a = (get() , 2);
var b;

function get(){
  b = 3;
}

 d = {a: a, b: b};
  `
	);
	deepEqual(a, 2);
	deepEqual(b, 3);
});

test("with call expression", () => {
	const { a, b } = evaluate(
		`
var b;    
var a = (get() , 2);

function get(){
  b = 3;
}

 d = {a: a, b: b};
  `
	);
	deepEqual(a, 2);
	deepEqual(b, 3);
});
