import { evaluate } from "../../src";

function deepEqual(a, b) {
	expect(a).toEqual(b);
}

test("Literal", () => {
	const output = evaluate(
		`
 d = {
  a: null,
  b: undefined,
  c: 0,
  d: "1",
  e: true
};
  `
	);
	deepEqual(output, {
		a: null,
		b: undefined,
		c: 0,
		d: "1",
		e: true,
	});
});
