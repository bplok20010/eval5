import { evaluate } from "../../src";

function deepEqual(a, b) {
	expect(a).toEqual(b);
}

test("TryStatement", () => {
	const obj = evaluate(
		`
var obj = {
  runTry: false,
  runError: false
};

try {
  obj.runTry = true;
} catch (err) {
  obj.runError = true;
}

 obj;
  `
	);

	deepEqual(true, obj.runTry);
	deepEqual(false, obj.runError);
});

test("TryStatement-with-throw", () => {
	const obj = evaluate(
		`
var obj = {
  runTry: false,
  runError: false
};

try {
  obj.runTry = true;
  throw new Error("invalid ...");
} catch (err) {
  obj.runError = true;
}

 obj;
  `
	);

	deepEqual(true, obj.runTry);
	deepEqual(true, obj.runError);
});

test("TryStatement with finally", () => {
	const obj = evaluate(
		`
var obj = {
  runTry: false,
  runError: false,
  runFinally: false
};

try {
  obj.runTry = true;
} catch (err) {
  obj.runError = true;
}finally{
  obj.runFinally = true;
}

 obj;
  `
	);

	deepEqual(true, obj.runTry);
	deepEqual(false, obj.runError);
	deepEqual(true, obj.runFinally);
});

test("continue in try block nest loop", () => {
	const arr = evaluate(
		`
var result = [];
var i = 0;

while(i<5){
  i++;
  try {
    if (i %2 === 0){
      continue; // continue the loop
    }
  } catch (err) {
    //
  }
  result.push(i);
}

 result;
  `
	);
	deepEqual(arr, [1, 3, 5]);
});

test("continue in catch block nest loop", () => {
	const arr = evaluate(
		`
var result = [];
var i = 0;

while(i<5){
  i++;
  try {
    if (i %2 === 0){
      throw new Error();
    }
  } catch (err) {
    //
    continue
  }
  result.push(i);
}

 result;
  `
	);
	deepEqual(arr, [1, 3, 5]);
});

test("continue in finally block nest loop", () => {
	const arr = evaluate(
		`
var result = [];
var i = 0;

while(i<5){
  i++;
  try {
    //
  } catch (err) {
    //
  }finally{
    if (i %2 === 0){
      continue;
    }
  }
  result.push(i);
}

 result;
  `
	);
	deepEqual(arr, [1, 3, 5]);
});

test("try-catch reset scope", () => {
	const a = evaluate(
		`
function m1(){
    var title = 'm1'

    throw 'error'
}
function m2(){
    var title = 'm2';
    m1();
    
}
function m3(){
    var title = 'm3';
    try {
        m2();
    } catch(e) {
      return  title
    }
}

m3()
  `
	);
	deepEqual(a, "m3");
});

test("try-catch reset context", () => {
	const a = evaluate(
		`
function m1(){
    throw 'error'
}
function m2(){
    m1.call('m1');
    
}
function m3(){
    try {
        m2.call('m2');
    } catch(e) {
      return this;
    }
}

m3.call('m3')
  `
	);
	deepEqual(a, "m3");
});

test("try-catch value returns -1", () => {
	const a = evaluate(`
        45;
        try {
            throw 'error'
        } catch(e){}
    `);
	expect(a).toEqual(undefined);
});

test("try-catch returns sequence -1", () => {
	const a = evaluate(`
        function test(){
            try {
                throw 1
            } catch(e){
                return 2
            }
        }
        test();
    `);

	expect(a).toEqual(2);
});

test("try-catch returns sequence -2", () => {
	const a = evaluate(`
        function test(){
            try {
                throw 1
            } catch(e){
                return 2
            } finally {
                return 3
            }
        }
        test();
    `);

	expect(a).toEqual(3);
});

test("try-catch returns sequence -3", () => {
	const a = evaluate(`
        function test(){
            try {
                return 1
            } catch(e){
                return 2
            } finally {
                return 3
            }
        }
        test();
    `);

	expect(a).toEqual(3);
});

test("try-catch returns sequence -4", () => {
	const a = evaluate(`
        function test(){
            try {
                return 1
            } catch(e){
                return 2
            }
        }
        test();
    `);

	expect(a).toEqual(1);
});
