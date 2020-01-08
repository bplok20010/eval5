// var vm = require("../lib/vm");

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

// const func = vm.compileFunction(code, ["num", "b"], {
// 	parsingContext: global,
// });

// const result = func(16);

// console.log(result);

// console.log(vm.runInContext(code2));
const util = require("util");
const vm = require("vm");

global.globalVar = 1;

const sandbox = {};
vm.createContext(sandbox);

for (let i = 0; i < 10; ++i) {
	vm.runInContext("globalVar = 2;");
}
console.log(sandbox.globalVar);
