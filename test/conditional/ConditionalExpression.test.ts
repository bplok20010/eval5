import { evaluate } from "../../src";

function deepEqual(a, b) {
	expect(a).toEqual(b);
}

test("ConditionalExpression-1", () => {
	const num = evaluate(
		`
 true ? 1 : 2;
  `
	);

	deepEqual(num, 1);
});

test("ConditionalExpression-or-2", () => {
	const num = evaluate(
		`
 false ? 1 : 2;
  `
	);

	deepEqual(num, 2);
});

test("ConditionalExpression with function call", () => {
	const num = evaluate(
		`
function isOnline(){
  return true
}
 isOnline() ? 1 : 2;
  `
	);

	deepEqual(num, 1);
});

test("ConditionalExpression in function call", () => {
	const isAdult = evaluate(
		`
function isAdult(age){
  return age >= 18 ? true : false
}
 isAdult;
  `
	);

	deepEqual(isAdult(18), true);
	deepEqual(isAdult(17.999), false);
});
