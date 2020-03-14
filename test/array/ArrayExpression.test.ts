import { evaluate } from "../../src";

test("ArrayExpression-1", () => {
	const arr = evaluate(
		`
var arr = [1, 2, 3];
arr.push(4);
arr;
  `
	);

	expect(Array.isArray(arr)).toBe(true);
	expect(arr.length).toBe(4);
	expect(arr).toEqual([1, 2, 3, 4]);
});

test("ArrayExpression-2", () => {
	const arr = evaluate(
		`
var arr = [,,1,2,3,,,];
arr.push(4);
arr;
  `
	);

	expect(Array.isArray(arr)).toBe(true);
	expect(arr.length).toBe(8);
});

test("ArrayExpression-3", () => {
	const arr = evaluate(
		`
function _t(){
    return 1 
}
var a = 1;
var arr = [a++, _t() + 2, 3  + 3, undefined];
arr.push(4);
arr;
  `
	);

	expect(Array.isArray(arr)).toBe(true);
	expect(arr.length).toBe(5);
	expect(arr).toEqual([1, 3, 6, undefined, 4]);
});

test("ArrayExpression-4", () => {
	const arr = evaluate(
		`
function _t(){
    return 1 
}
var a = 1;
var arr = [1,2,null,undefined];
arr.push(4);
arr;
  `
	);

	expect(Array.isArray(arr)).toBe(true);
	expect(arr.length).toBe(5);
	expect(arr).toEqual([1, 2, null, undefined, 4]);
});

test("ArrayExpression-5", () => {
	const arr = evaluate(
		`
[1,2]
  `
	);

	expect(arr).toEqual([1, 2]);
});
