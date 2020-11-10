# eval5

中文 | [English](./README-en_US.md)

[![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/bplok20010/eval5/blob/master/LICENSE)
[![npm](https://img.shields.io/npm/v/eval5)](https://www.npmjs.com/package/eval5)
[![npm bundle size](https://img.shields.io/bundlephobia/min/eval5)](https://raw.githubusercontent.com/bplok20010/eval5/master/umd/eval5.min.js)

基于 TypeScript 编写的 JavaScript 解释器，支持完整 ES5 语法

**支持浏览器、node.js、小程序等 JavaScript 运行环境**

[在线体验](https://bplok20010.github.io/eval5/)

[更多示例](https://bplok20010.github.io/eval5/examples.html)

## 使用场景

-   浏览器环境中需要使用沙盒环境执行 JavaScript 脚本
-   控制执行时长
-   不支持`eval` `Function`的 JavaScript 运行环境：如 微信小程序 [demo](https://github.com/bplok20010/eval5-wx-demo) [we-script](https://github.com/bplok20010/we-script) [taro-script](https://github.com/bplok20010/taro-script)
-   研究/学习用

## 支持 ECMAScript 版本

ES5

## 安装

```
npm install --save eval5
```

## 使用

[![Edit eval5](https://codesandbox.io/static/img/play-codesandbox.svg)](https://codesandbox.io/s/eval5-zxndl?fontsize=14&hidenavigation=1&theme=dark)

```javascript
import { Interpreter } from "eval5";

const interpreter = new Interpreter(window, {
	timeout: 1000,
});

let result;

try {
	result = interpreter.evaluate("1+1");
	console.log(result);

	interpreter.evaluate("var a=100");
	interpreter.evaluate("var b=200");
	result = interpreter.evaluate("a+b");

	console.log(result);
} catch (e) {
	console.log(e);
}
```

## 参数

```ts
interface Options {
	// 默认为：0，不限制
	timeout?: number;
	// 根作用域，只读
	rootContext?: {} | null;
	globalContextInFunction?: any;
}
```

示例

```
import { Interpreter } from "eval5";

const ctx = {};
const interpreter = new Interpreter(ctx, {
    rootContext: window,
	timeout: 1000,
});

interpreter.evaluate(`
    a = 100;
    console.log(a); // 100
`);

window.a;//undefined

```

## Interpreter

**`version`**

当前版本

**`global`**

默认值: `{}`

设置默认的全局作用域

```js
Interpreter.global = window;
const interpreter = new Interpreter();
interpreter.evaluate('alert("hello eval5")');
```

**`globalContextInFunction`**

默认值: `undefined`

`eval5` 不支持 `use strict` 严格模式, 在非严格下的函数中`this`默认指向的是全局作用域，但在`eval5`中是`undefined`， 可通过`globalContextInFunction`来设置默认指向。

```js
import { Interpreter } from "Interpreter";

const ctx = {};
const interpreter = new Interpreter(ctx);
interpreter.evaluate(`
this; // ctx
function func(){
    return this; // undefined
}
func();
`);
```

```js
import { Interpreter } from "Interpreter";

Interpreter.globalContextInFunction = window;
const ctx = {};
const interpreter = new Interpreter({});
interpreter.evaluate(`
this; // ctx
function func(){
    return this; // window
}
func();
`);
```

原因，示例代码：

> **注意: alert异常**

```
import { Interpreter } from "Interpreter";

Interpreter.globalContextInFunction = {};

const ctx = {alert: alert};

const interpreter = new Interpreter(ctx);

interpreter.evaluate(`
// throw Illegal invocation
alert('Hello eval5'); // 同 alert.call({}, 'Hello eval5')
`);
```

**`constructor(context = Interpreter.global, options?: Options )`**

构造函数

## Interpreter 的实例方法

**`evaluate(code: string): any`**

执行给定的字符串代码，并返回最后一个表达式的值

```js
import { Interpreter } from "Interpreter";

const interpreter = new Interpreter(window);

const result = interpreter.evaluate(`
var a = 100;
var b = 200;

a+b;

`);

console.log(result); // 300
```

**`appendCode(code: string): any`**

`evaluate`的别名

**`getExecutionTime(): number`**

获取上一次调用`evaluate`的执行时长

**`setExecTimeout(timeout: number = 0): void`**

设置执行时长

**`getOptions(): Readonly<Options>`**

获取解释器参数

---

## evaluate(code: string, ctx?: {}, options?: Options)

执行给定的字符串代码，并返回最后一个表达式的值

> 注: 该函数每次执行都会创建一个新的解释器

```js
import { evaluate } from "eval5";

evaluate(
	`
var a = 100;
var b = 100;
console.log(a+b);
`,
	{ console: console }
); // 200

evaluate(`
    a;
`); // a is not defined
```

## Function

该函数会将`Interpreter.global` `Interpreter.globalContextInFunction`当作默认值并创建新的解释器

```js
import { Function } from "eval5";

const func = new Function("a", "b", "return a+b;");
console.log(func(100, 200)); // 300
```

## vm

查看 [vm](https://nodejs.org/dist/latest-v13.x/docs/api/vm.html)

-   vm.createContext
-   vm.compileFunction
-   vm.runInContext
-   vm.runInNewContext
-   vm.Script

## License

MIT

## 相关

-   [evaljs](https://github.com/marten-de-vries/evaljs)
-   [closure-interpreter](https://github.com/int3/closure-interpreter)
