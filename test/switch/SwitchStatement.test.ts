import { evaluate } from "../../src";

function deepEqual(a, b) {
	expect(a).toEqual(b);
}

test("SwitchStatement", () => {
	const func = evaluate(
		`
function t1(type) {
  switch (type) {
    case "world":
      return "hi world";
    case "eval5":
      return "hi eval5";
    default:
      return "hello world";
  }
}

 t1;
  `
	);

	deepEqual(true, typeof func === "function");
	deepEqual(func("world"), "hi world");
	deepEqual(func("eval5"), "hi eval5");
	deepEqual(func("aa"), "hello world");
});

test("SwitchStatement-2", () => {
	const func = evaluate(
		`
function t2(type) {
  switch (true) {
    case type === "world":
      return "hi world";
    case type === "eval5":
      return "hi eval5";
    default:
      return "hello world";
  }
}

 t2;
  `
	);

	deepEqual(true, typeof func === "function");
	deepEqual(func("world"), "hi world");
	deepEqual(func("eval5"), "hi eval5");
	deepEqual(func("aa"), "hello world");
});

test("SwitchStatement with continue", () => {
	const func = evaluate(
		`
function t3(type) {
  var result = [];
  var i = 0;
  while (i < 5) {
    i++;
    switch (type + "") {
      case "0":
        continue;
    }
    result.push(i);
  }
  return result;
}

 t3;
  `
	);

	// deepEqual(func(1), [1, 2, 3, 4, 5]);
	// deepEqual(func(2), [1, 2, 3, 4, 5]);

	// the will loop will be continue
	deepEqual(func(0), []);
});
