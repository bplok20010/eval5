# eval5

基于 JavaScript 编写的 JavaScript 解释器;A JavaScript interpreter, written completely in JavaScript;

> 用于解决在不支持`eval`或`Function`的执行环境下执行 JavaScript 代码。例如：各种小程序。

## Usage

`npm install --save eval5`

```
import { evaluate, Function, vm, Interpreter } from 'eval5';

// 设置默认作用域
Interpreter.global = window;

//或 evaluate("1+1", Object.create(window));
evaluate("1+1", window); // 2

const func = new Function('a','b', 'return a+b;');

console.log(func(1,1)); // 2

const interpreter = new Interpreter(ctx, {
    timeout: 1000
});

let result;

try {
    result = interpreter.evaluate('1+1');
    console.log(result) //2
} catch(e) {
    //..
}

```

## Interpreter

### `static` global

设置默认作用域对象

例如:

```
Interpreter.global = window;

```

### `constructor`(ctx: {}, options?: { timeout?: number})

构造函数

```
var interpreter = new Interpreter(window);
```

### `evaluate`(code: string, ctx?: {}): any

返回脚本中执行的最后一个表达式结果

```
var interpreter = new Interpreter(window);
interpreter.evaluate('alert(1+1)')
```

## evaluate(code: string, ctx?: {})

执行给定的字符串脚本,返回脚本中执行的最后一个表达式结果

```
evaluate('console.log(1+1)', {console: console})
```

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
