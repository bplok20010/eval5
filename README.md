# eval5

基于 JavaScript 编写的 JavaScript 解释器;A JavaScript interpreter, written completely in JavaScript;

> 用于解决在不支持`eval`或`Function`的执行环境下执行 JavaScript 代码。例如：各种小程序。

## usage

`npm install --save eval5`

```
import { evaluate, Function, vm, Interpreter } from 'eval5';

// 设置默认作用域
Interpreter.global = window;

evaluate("1+1"); // 2

const func = new Function('a','b', 'return a+b;');

console.log(func(1,1)); // 2

const interpreter = new Interpreter(ctx, {
    timeout: 1000
});

let result;

try {
    result = interpreter.evaluate('1+1')
} catch(e) {
    //..
}

console.log(result) //2

```

## Interpreter

### `static` global

设置默认作用域对象

### `constructor`(ctx: {}, options?: { timeout?: number})

构造函数

### `evaluate`(code: string, ctx?: {}): any

返回脚本中执行的最后一个表达式结果的结果

## evaluate(code, ctx?)

执行给定的字符串脚本

## Function

同 js 原生的 Function

```
const func = new Function('a','b', 'return a+b;');
console.log(func(1,2))
```

## vm

参考 `node.js vm`

支持 api 列表:

-   vm.createContext
-   vm.compileFunction
-   vm.runInContext
-   vm.runInNewContext
-   vm.Script

## License

ISC

## Support

-   ECMA5

## Related

[evaljs][]
[closure-interpreter][]

[evaljs]: https://github.com/marten-de-vries/evaljs
[closure-interpreter]: https://github.com/int3/closure-interpreter
