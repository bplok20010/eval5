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

{
    var a = 2;
}
`;
new Interpreter(code, { context: {} });
