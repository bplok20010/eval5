const { evaluate } = require("../../lib");

function deepEqual(a, b) {
	expect(a).toEqual(b);
}


test("ForStatement-1", () => {
	const obj = evaluate(
		`
const obj = {num: 0};
for (let i = 0; i < 3; i++) {
  obj.num++;
}

 obj;
  `,
		
	);

	deepEqual(true,typeof obj.num === "number");
	deepEqual(obj.num, 3);
});

test("ForStatement-2", () => {
	const obj = evaluate(
		`
const obj = {num: 0};
for (;;) {
  obj.num++;
  if (obj.num >= 3) {
    break;
  }
}

 obj;
  `,
		
	);

	deepEqual(true,typeof obj.num === "number");
	deepEqual(obj.num, 3);
});
