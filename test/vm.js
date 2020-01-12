var { Function, vm, Interpreter } = require("../lib");

const code = `
var result = [];
function fibonacci(n, output) {
  var a = 1, b = 1, sum;
  for (var i = 0; i < n; i++) {
    output.push(a);
    sum = a + b;
    a = b;
    b = sum;
  }
}
fibonacci(num, result);
return result;
`;
const code2 = `
var result = [];
function fibonacci(n, output) {
  var a = 1, b = 1, sum;
  for (var i = 0; i < n; i++) {
    output.push(a);
    sum = a + b;
    a = b;
    b = sum;
  }
}
fibonacci(16, result);

result
`;

const func = vm.compileFunction(code, ["num", "b"], {
	parsingContext: global,
});

const result = func(16);

console.log(result);

console.log(evaluate(code2));

evaluate("var a=1;console.log(1+1+a)");

const f1 = new Function("a", "b", "console.log(this);return a+b;");

console.log(f1.call("call this", 2, 2));
