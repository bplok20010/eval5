# eval5

A JavaScript interpreter, written completely in JavaScript; JavaScript 解释器

## usage

`npm install --save eval5`

```
import { evaluate, Function, vm, Interpreter } from 'eval5';

// init context
Interpreter.global = window;

evaluate("1+1"); // 2

const func = new Function('a','b', 'return a+b;');

console.log(func(1,1)); // 2

const interpreter = new Interpreter(ctx, {
    timeout: 1000 //ms
});

try {
    interpreter.evaluate('1+1')
} catch(e) {
    //..
}

interpreter.getValue(); //2

```
