import { evaluate } from "../../src";

test("VariableDeclaration-var1", () => {
	const a = evaluate(
		`
var a = 123;

  `
	);

	expect(a).toEqual(undefined);
});

test("VariableDeclaration-var2", () => {
	const a = evaluate(
		`
var a = 123;
a;
  `
	);

	expect(a).toEqual(123);
});

test("VariableDeclaration-var3", () => {
	const a = evaluate(
		`
function _t1(){
  var a = 123;
  return a;
}
_t1();
    `
	);
	expect(a).toEqual(123);
});

test("VariableDeclaration-var4", () => {
	const a = evaluate(
		`
name = "story"
var name;
    `
	);
	expect(a).toEqual("story");
});

test("VariableDeclaration-var5", () => {
	const a = evaluate(
		`
var name = "hello"
name = "world"
    `
	);
	expect(a).toEqual("world");
});

test("VariableDeclaration-var6", () => {
	const func = evaluate(
		`
function run(){
  var name = "world";
  return name;
}

run

      `
	);

	expect(func()).toEqual("world");
});

test("VariableDeclaration-var7", () => {
	const a = evaluate(
		`
  name = "world";
  name = "hello";

      `
	);

	expect(a).toEqual("hello");
});

test("VariableDeclaration-var8", () => {
	const a = evaluate(
		`
function r(){
    return 'a'
}

var a = {n: 2, a: 1+1, c: r()+1,d: [1,2,r()]};

a
      `
	);

	expect(a).toEqual({
		n: 2,
		a: 2,
		c: "a1",
		d: [1, 2, "a"],
	});
});

test("VariableDeclaration-var8", () => {
	const a = evaluate(
		`
var a = {
    b: 1,
    c: 1,
    xy: '1',
    z: {
        p:1,
        kk: 1
    }
}

a.b = 2;
a['c'] = 2
a['x'+'y'] = 2
a.z['k'+'k'] = 2
a.z.p = 2

a
      `
	);

	expect(a).toEqual({
		b: 2,
		c: 2,
		xy: 2,
		z: {
			p: 2,
			kk: 2,
		},
	});
});

test("VariableDeclaration-var9", () => {
	const a = evaluate(
		`
        var a = undefined;
        a;

        `,
		Object.create(null)
	);

	expect(a).toEqual(undefined);
});
