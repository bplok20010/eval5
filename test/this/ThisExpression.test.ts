import { evaluate } from "../../src";

function deepEqual(a, b) {
	expect(a).toEqual(b);
}

test("ThisExpression", () => {
	const func = evaluate(
		`
function t(){
  this.name = "hello";
  return this;
}

 t;
  `
	);

	const ctx: { [x: string]: any } = {};

	func.call(ctx);

	deepEqual(ctx.name, "hello");
});

test("global this", () => {
	const ctx = {
		test: 1,
	};
	const a = evaluate(
		`
        this
  `,
		ctx
	);

	expect(a === ctx).toEqual(true);
});
