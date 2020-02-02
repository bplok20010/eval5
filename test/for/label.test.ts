import { evaluate } from "../../src";

function deepEqual(a, b) {
	expect(a).toEqual(b);
}

test("break with label", () => {
	const num = evaluate(
		`
var num;

loop1:
for (var i=0;i<10;i++) {
  if (i===6){
    break loop1;
  }
  num = ++i;
}

 num;
  `
	);
	deepEqual(true, typeof num === "number");
	deepEqual(num, 5);
});

test("nest for loop with label", () => {
	const { i, m } = evaluate(
		`

loop1:
for (var i=0;i<3;i++) {
  loop2:
  for (var m=1;m<3;m++){
    if (m%2===0){
      break loop1;
    }
  }
}

d= {i: i, m: m};
  `
	);
	deepEqual(i, 0);
	deepEqual(m, 2);
});

test("endless for loop with label", () => {
	const { i, m, y } = evaluate(
		`
loop1:
for (var i=0;i<3;i++) {
  loop2:
  for (var m=1;m<3;m++){
    if (m%2===0){
      break loop1;
    }
    loop3:
    for (var y = 1; y < 10; y++){
      if (y%5===0){
        break loop2;
      }
    }
  }
}

d= {i: i, m: m, y: y};
  `
	);
	deepEqual(i, 3);
	deepEqual(m, 1);
	deepEqual(y, 5);
});

test("continue with label", () => {
	const { i, m, y } = evaluate(
		`
loop1:
for (var i=0;i<3;i++) {
  loop2:
  for (var m=1;m<3;m++){
    if (m%2===0){
      break loop1;
    }
    loop3:
    for (var y = 1; y < 10; y++){
      if (y%5===0){
        continue loop2; // skip loop2
      }
    }
  }
}

d= {i: i, m: m, y: y};
  `
	);
	deepEqual(i, 0);
	deepEqual(m, 2);
	deepEqual(y, 5);
});
