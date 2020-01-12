const { evaluate } = require("../../lib");

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

	const ctx = {};

	func.call(ctx);

	deepEqual(ctx.name, "hello");
});
