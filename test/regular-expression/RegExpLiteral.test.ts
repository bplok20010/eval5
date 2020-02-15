import { evaluate } from "../../src";

function deepEqual(a, b) {
	expect(a).toEqual(b);
}

test("basic without flags", () => {
	const func = evaluate(
		`
var reg = /^hello/;

function isSayHi(word) {
  return reg.test(word);
}

 isSayHi;
  `
	);

	deepEqual(true, func("hello world"));
	deepEqual(false, func("abcd"));
});

test("with flags", () => {
	const func = evaluate(
		`
var reg = /^hello/i;

function isSayHi(word) {
  return reg.test(word);
}

 isSayHi;
  `
	);

	deepEqual(true, func("hello world"));
	deepEqual(true, func("Hello woRld"));
});

test("with multiple flags", () => {
	const func = evaluate(
		`
var reg = /^hello/im;

function isSayHi(word) {
  return reg.test(word);
}

 isSayHi;
  `
	);

	deepEqual(true, func("hello world"));
	deepEqual(true, func("Hello woRld"));
	deepEqual(true, func("Hello \nwoRld"));
});
