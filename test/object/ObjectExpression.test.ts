import { evaluate, Interpreter } from "../../src";

function deepEqual(a, b) {
	expect(a).toEqual(b);
}

test("basic", () => {
	const obj = evaluate(
		`
var obj = {
  i: 0
};

 obj;
  `
	);

	deepEqual(true, typeof obj.i === "number");
	deepEqual(obj.i, 0);
});

test("object with method -1", () => {
	const obj = evaluate(
		`
var obj = {
  i: 0,
  get: function(){
    return this.i;
  }
};

 obj;
  `
	);
	deepEqual(obj.i, 0);
	deepEqual(obj.get(), obj.i);
});

test("object with method -2", () => {
	const inst = new Interpreter({}, { ecmaVersion: 6 });
	const obj = inst.evaluate(
		`
var obj = {
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
var obj = {
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

test("object with setter method -1", () => {
	const obj = evaluate(
		`
var obj = {
    getCounter: 0,
  i: 0,
  get value(){
    this.getCounter++;
    return this.i
  },
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
	expect(obj.getCounter).toBe(0);
});

test("object with setter method -2", () => {
	const r = evaluate(
		`
var obj = {
    getCounter: 0,
  i: 0,
  get value(){
    this.getCounter++;
    return this.i
  },
  set value(val){
    this.i = val;
  }
};

 obj;
 var result = [obj.i];
 obj.value = 123;
 result.push(obj.i);
 result.push(obj.getCounter);
 result
  `
	);

	expect(r).toEqual([0, 123, 0]);
});

test("object function name", () => {
	const inst = new Interpreter({}, { ecmaVersion: 6 });
	const a = inst.evaluate(
		`
var obj = {
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
