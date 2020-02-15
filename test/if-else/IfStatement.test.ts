import { evaluate } from "../../src";

function deepEqual(a, b) {
	expect(a).toEqual(b);
}

test("if", () => {
	const obj = evaluate(
		`
var obj = {
  isTrue: false
};

if (true){
  obj.isTrue = true;
}

 obj;
  `
	);

	deepEqual(true, typeof obj.isTrue === "boolean");
	deepEqual(true, obj.isTrue);
});

test("if-else", () => {
	const obj = evaluate(
		`
var obj = {
  isTrue: false
};

if (false){
  obj.isTrue = true;
}else{
  obj.isTrue = true;
}

 obj;
  `
	);

	deepEqual(true, typeof obj.isTrue === "boolean");
	deepEqual(true, obj.isTrue);
});

test("if else-else if", () => {
	const obj = evaluate(
		`
var obj = {
  block: ''
};

if (false){
  obj.block = "if";
}else if(true){
  obj.block = "else if";
}

 obj;
  `
	);

	deepEqual(obj.block, "else if");
});

test("if-else-else if-else", () => {
	const obj = evaluate(
		`
var obj = {
  block: ''
};

if (false){
  obj.block = "if";
}else if(false){
  obj.block = "else if";
}else{
  obj.block = "else";
}

 obj;
  `
	);

	deepEqual(obj.block, "else");
});
