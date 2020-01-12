const { evaluate } = require("../../lib");

function deepEqual(a, b) {
	expect(a).toEqual(b);
}

test("basic", () => {
	const obj = evaluate(
		`
const obj = {
  i: 0
};
do {
  obj.i++;
} while (obj.i < 3);

 obj;
  `,
		
	);

	deepEqual(true,typeof obj.i === "number");
	deepEqual(obj.i, 3);
});

test("break in do block", () => {
	const obj = evaluate(
		`
const obj = {
  i: 0
};
do {
  obj.i++;
  break;
} while (obj.i < 3);

 obj;
  `,
		
	);
	deepEqual(obj.i, 1);
});

test("do-while in function with return, it should cross block scope", () => {
	const get = evaluate(
		`
function get() {
  const obj = {
    i: 0
  };
  do {
    obj.i++;
    return obj;
  } while (obj.i < 3);
}

  get;
  `,
		
	);
	deepEqual(get(), { i: 1 });
});
