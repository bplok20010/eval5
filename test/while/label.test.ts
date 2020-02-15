import { evaluate } from "../../src";

function deepEqual(a, b) {
	expect(a).toEqual(b);
}

test("break with label", () => {
	const i = evaluate(
		`
var i = 1;
loop1:
while(true){
  i++;
  break loop1;
}

 i;
  `
	);
	deepEqual(i, 2);
});

test("continue with label", () => {
	const { i, arr } = evaluate(
		`
var i = 10;
var arr = [];
loop1:
while(i > 0){
  if (i % 2 === 1){
    i--;    
    continue; 
  }
  arr.push(i);  
  i--;  
}

 d = {i:i, arr:arr};
  `
	);
	deepEqual(i, 0);
	deepEqual(arr, [10, 8, 6, 4, 2]);
});
