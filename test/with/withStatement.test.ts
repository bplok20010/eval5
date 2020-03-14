import { evaluate } from "../../src";

function deepEqual(a, b) {
	expect(a).toEqual(b);
}

test("with1", () => {
	const a = evaluate(`
    var a1 = 1;
    var obj = {
        a1 :2
    }
with(obj){
    a1
}
    `);

	deepEqual(a, 2);
});

test("with2", () => {
	const a = evaluate(`
    function o1(){}
 o1.prototype.x = 100;
 var z = new o1();

 with(z) {
     x
 }
    `);

	deepEqual(a, 100);
});

test("with3", () => {
	var ctx: Record<string, any> = {};
	const result = evaluate(
		`

    var obj = {}

    with(obj) {
        a = 10
    }

    obj.a

    `,
		ctx
	);

	expect(result).toEqual(undefined);
	expect(ctx.a).toEqual(10);
});
