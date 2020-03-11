# eval5

[![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/bplok20010/eval5/blob/master/LICENSE)
[![npm](https://img.shields.io/npm/v/eval5)](https://www.npmjs.com/package/eval5)
[![npm bundle size](https://img.shields.io/bundlephobia/min/eval5)](https://raw.githubusercontent.com/bplok20010/eval5/master/umd/eval5.min.js)

基于 JavaScript 编写的 JavaScript 解释器;A JavaScript interpreter, written completely in JavaScript;

支持 es5 语法

> 解决在不支持`eval`或`Function`的执行环境下执行 JavaScript 代码。例如：微信小程序 [示例](https://github.com/bplok20010/eval5-wx-demo)。

## Usage

`npm install --save eval5`

```javascript
import { evaluate, Function, vm, Interpreter } from "eval5";

// 设置默认作用域
Interpreter.global = window;

evaluate("1+1", window); // 2

const func = new Function("a", "b", "return a+b;");

console.log(func(1, 1)); // 2

const ctx = window;
const interpreter = new Interpreter(ctx, {
	timeout: 1000,
});

let result;

try {
	result = interpreter.evaluate("1+1");
	console.log(result); //2
} catch (e) {
	//..
}
```

## Interpreter

### static `version`

VERSION

### static `global`

`object` 默认：`Object.create(null)`

设置默认作用域对象

例如:

```javascript
import { Interpreter } from "eval5";

Interpreter.global = window;
```

### static `eval`

`readonly`

替代原有的`eval`占位符

> 如果执行环境支持 eval 函数建议使用原生的 eval，除非 eval 需要使用局部变量时，如下情况：

```javascript
import { Interpreter } from "eval5";

const ctx = Object.create(window);

ctx.eval = Interpreter.eval;

const interpreter = new Interpreter(ctx);

interpreter.evaluate(`
    function test(){
        var a = 1;
        return eval('a+1')
    }
    test();
`); // output 2
```

### static `Function`

`readonly`

替代原有的`Function`占位符

作用同`Interpreter.eval`

> 除非不支持`Function`的环境，否则不建议使用

### static `ecmaVersion`

可选值： `3 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 2015 | 2016 | 2017 | 2018 | 2019 | 2020`

默认： `5`

> 注：eval5 只支持 es5 语法，如果将 ecmaVersion 设为高版本尽管能编译通过，但解释时可能会报错或得到错误结果。

例如，如果设`ecmaVersion=6`或更高，以下代码可以正常解析执行，但结果非预期：

```
const a = [];
for(let i = 0; i < 10; i++) {
    a.push(function(){
        console.log(i);
    })
}

...

// output: 10 10 10...
```

**原因在于解释器会忽略`const` `let`类型，都当作`var`处理。**

### `constructor`(ctx: {} = Interpreter.global, options?: { timeout?: number})

构造函数

```javascript
import { Interpreter } from "eval5";

var interpreter = new Interpreter(window);
```

### `evaluate`(code: string): any

返回脚本中执行的最后一个表达式结果

```javascript
import { Interpreter } from "eval5";

var interpreter = new Interpreter(window);
interpreter.evaluate("alert(1+1)");
```

### appendCode(code: string): any

作用同`evaluate`

### setExecTimeout(timeout: number)

单位：ms

获取`evaluate`的执行时间

## evaluate(code: string, ctx?: {})

执行给定的字符串脚本,返回脚本中执行的最后一个表达式结果

```javascript
import { evaluate } from "eval5";

evaluate("console.log(1+1)", { console: console });
```

## Function

```javascript
import { Function } from "eval5";

const func = new Function("a", "b", "return a+b;");
console.log(func(1, 2));
```

## vm

参考 `node.js vm`

支持 api 列表:

-   vm.createContext
-   vm.compileFunction
-   vm.runInContext
-   vm.runInNewContext
-   vm.Script

## Tips

`eval5`不支持`use strict`模式，但在函数的调用中`this`默认值是`undefined`，可通过设置`Interpreter.rootContext`来设置`this`的默认值，如：

```
const code = `
function test(){
   return this;// undefined
}
test();
`
evaluate(code)
```

```
Interpreter.rootContext = 1;

const code = `function test(){
    return this;// 1
}
test();
`
evaluate(code)

```

## License

MIT

## Support

-   ECMA5

## Related

[evaljs][]
[closure-interpreter][]

[evaljs]: https://github.com/marten-de-vries/evaljs
[closure-interpreter]: https://github.com/int3/closure-interpreter
