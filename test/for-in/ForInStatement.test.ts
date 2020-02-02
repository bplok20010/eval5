import { evaluate } from "../../src";

function deepEqual(a, b) {
	expect(a).toEqual(b);
}


test("ForInStatement-1", () => {
	const obj = evaluate(
		`
const obj = {
  1: false,
  2: false
};

for (let attr in obj) {
  obj[attr] = true;
}

 obj;
  `,
		
	);

	deepEqual(true,obj[1]);
	deepEqual(true,obj[2]);
});

test("ForInStatement-2", () => {
	const obj = evaluate(
		`
const obj = {
  1: false,
  2: false
};

for (let attr in obj) {
  if (obj.hasOwnProperty(attr)){
    obj[attr] = true;
  }
}

 obj;
  `,
		
	);

	deepEqual(true,obj[1]);
	deepEqual(true,obj[2]);
});
