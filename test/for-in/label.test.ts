import { evaluate } from "../../src";

function deepEqual(a, b) {
	expect(a).toEqual(b);
}

test("break with label", () => {
	const obj = evaluate(
		`
var obj = {
  1: false,
  2: false,
  3: false
};

loop1:
for (var attr in obj) {
  obj[attr] = true;
  if (attr % 2 === 0){
    break loop1;
  }
}

 obj;
  `
	);

	deepEqual(obj, {
		1: true,
		2: true,
		3: false,
	});
});

test("break with label", () => {
	const { attr, index } = evaluate(
		`
var obj = {
  1: false,
  2: false,
  3: false
};

loop1:
for (var attr in obj) {
  obj[attr] = true;
  loop2:
  for (var index in [1,2,3,4]){
    if ((index + 1)%3 === 0){
      break loop1;
    }
  }
}

 d = {attr: attr, index: index};
  `
	);

	deepEqual(attr, "1");
	deepEqual(index, "2");
});

test("continue with label", () => {
	const { attr, index, m } = evaluate(
		`
var obj = {
  1: false,
  2: false,
  3: false
};

loop1:
for (var attr in obj) {
  obj[attr] = true;
  loop2:
  for (var index in [1,2,3,4]){
    if ((index + 1)%3 === 0){
      break loop1;
    }
    loop3:
    for (var m in [1, 2, 3, 4]){
      if ((m + 1) % 2 === 0){
        continue loop2;
      }
    }
  }
}

 d = {attr: attr, index:index,m: m};
  `
	);

	deepEqual(attr, "1");
	deepEqual(index, "2");
	deepEqual(m, "3");
});
