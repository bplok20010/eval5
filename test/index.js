var Interpreter = require("../lib/interpreter").default;
const code = `
var a = 1;
var iarr = [1,2,'a',a]
var obj = {
    iarr: iarr,
    a:1,
    b: 'a',
    c: a
}

// obj.obj = obj;
obj.z  = a;
obj[a]  = a;
obj['j'] = 'x';
obj.k = iarr;

//sequenceExpression
var a1,a2,a3,a4,a5;
a5 = (a1 = a,a2 = 'a',a3 = obj,a4 = iarr)

var n1,n2;

n1 = a++;
n2 = ++a
var a = 1;
obj.a0 = a++;
obj.a1 = ++a;
obj.type = typeof a
obj.type1 = +a

obj.ba1 = a === a
obj.ba2 = 3 << 1 

obj.iarr2 = new Array(10)

var d = new Date()

{
    var a = 2;
}

function f1(){
    obj.scp = 1;
}

f1()

`;
new Interpreter(code, { context: { Array, Date } });
