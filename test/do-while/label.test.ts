import { evaluate } from "../../src";

function deepEqual(a, b) {
	expect(a).toEqual(b);
}

test("break with label", () => {
	const a = evaluate(
		`
var a = 1;

doLoop:
do {
  a++;
  break doLoop;
} while (true);

 a;
  `,
		
	);
	deepEqual(a, 2);
});

test("continue with label", () => {
	const a = evaluate(
		`
var a = 1;

doLoop:
do {
  a++;
  continue doLoop;
} while (a<10);

 a;
  `,
		
	);
	deepEqual(a, 10);
});
