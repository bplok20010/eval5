import { evaluate } from "../../src";

function deepEqual(a, b) {
	expect(a).toEqual(b);
}

test("basic", () => {
	const obj = evaluate(
		`
const obj = {
  i: 0
};

 obj;
  `
	);

	deepEqual(true, typeof obj.i === "number");
	deepEqual(obj.i, 0);
});

test("object with method", () => {
	const obj = evaluate(
		`
const obj = {
  i: 0,
  get(){
    return this.i;
  }
};

 obj;
  `
	);
	deepEqual(obj.i, 0);
	deepEqual(obj.get(), obj.i);
});

test("object with getter method", () => {
	const obj = evaluate(
		`
const obj = {
  i: 0,
  get value(){
    return this.i;
  }
};

 obj;
  `
	);
	deepEqual(obj.i, 0);
	deepEqual(obj.value, obj.i);
});

test("object with setter method", () => {
	const obj = evaluate(
		`
const obj = {
  i: 0,
  set value(val){
    this.i = val;
  }
};

 obj;
  `
	);
	deepEqual(obj.i, 0);
	obj.value = 123;
	deepEqual(obj.i, 123);
});

test("object function name", () => {
	const a = evaluate(
		`
const obj = {
   v1(){
  },
  
  v2: function(){},

  v: function v3(){}

};

 [obj.v1.name, obj.v2.name, obj.v.name]
  `
	);
	deepEqual(a, ["v1", "v2", "v3"]);
});
