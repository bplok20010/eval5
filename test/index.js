var { Interpreter } = require("../lib/interpreter");
var fs = require("fs-extra");

let jsCode = fs.readFileSync("./test/underscore.js");
let acornCode = fs.readFileSync("./test/acorn.js");

const code = `
// var s345 = adsf12

// var x=1

// new x()


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
   console.log('f1', obj.scp, this)
}

obj.fc = f1;


obj.fc()

f1.call(123)


function t(a,b,c){
    return 'c'
}

var s = {
    a:1,
    b:2,
    c1:2
}

delete s.a;
delete s['b'];
delete s[t()+ '1' ]
console.log('function name length')
console.log(s, t.name, t.length)

console.log(1? 't': 'f')
console.log(0? 't': 'f')

if( 1 ) {
    console.log('t');
}

if( 0 ) {
    
} else {
    console.log('f')
}

if( 0 ) {
    
} else if(1){
    console.log('t1')
}
 console.log('for')
for(var i = 0 ;i< 10; i++) {
    if( i > 3 )  break;
    ;
  console.log(i, 'for??')
}

 console.log('ab',i);
 console.log('while')

var i = 2;
while(i<10) {
    console.log(i);

    if(i > 5) break;
    i++
}

console.log(i)

 console.log('do while')

var i = 2;
do {
    console.log(i);

    break;
} while(i<10)

console.log(i)

 console.log('with')
with(obj){
  console.log(a1)
}

function forInTest(){
    // for-in
    console.log('for-in1')
    var fff = {
        a:1,
        b:2,
        c:3
    }

    for(var k in fff) {
        console.log(k, fff[k]);
    }
    console.log('for-in2')
    for(var k in fff) {
        if( k == 'b' ) continue;
        console.log(k, fff[k]);
    }

    console.log('for-in3')
    for(var k in fff) {
        if( k == 'b' ) break;
        console.log(k, fff[k]);
    }

    console.log('for-in4')
    for(var k in fff) {
        if( k == 'b' ) {
            return 'for-in return';
        };
        console.log(k, fff[k]);
    }

}

console.log(forInTest());


// arguments
 console.log('arguments')
function arg(ta,tb){
    console.log(arguments)
}

arg(1,2,3,4)

var m1 = {
    obj:1,
    a: 'x'
}
 console.log('with')
with(m1) {
    console.log(obj, a)
}
 console.log('with3')

 function o(){}
 o.prototype.x = 100;
 var z = new o();

 with(z) {
     console.log(x)
 }

 // try catch
console.log('try...catch');
function tcatch(){
    throw new Error('try catch')
}
try{
    console.log('tc1');
    console.log('tc2');
    tcatch();
    console.log('tc3');
} catch(e) {
    console.log('c1')
} finally {
    console.log('f1');
}
console.log('try...catch2');
try{
    console.log('tc1');
    console.log('tc2');
    console.log('tc3');
} catch(e) {
    console.log('c1')
} finally {
    console.log('f1');
}

console.log('try...catch3');
try {
  try {
    throw new Error("oops");
  }
  finally {
    console.log("finally");
  }
}
catch (ex) {
  console.error("outer", ex.message);
}
console.log('try...catch4');
try {
  try {
    throw new Error("oops");
  }
  catch (ex) {
    console.error("inner", ex.message);
  }
  finally {
    console.log("finally");
  }
}
catch (ex) {
  console.error("outer", ex.message);
}
console.log('try...catch5');
!function(){
    try {
    try {
        throw new Error("oops");
    }
    catch (ex) {
        console.error("inner", ex.message);
        throw ex;
    }
    finally {
        console.log("finally");
    }
    }
    catch (ex) {
    console.error("outer", ex.message);
    }
}()
console.log('try...catch6');
var r= (function(){
    try {
    try {
        throw new Error("oops");
    }
    catch (ex) {
        console.error("inner", ex.message);
        throw ex;
    }
    finally {
        console.log("finally");
        return 1;
    }
    }
    catch (ex) {
    console.error("outer", ex.message);
    }
})()

console.log(r);

console.log('try...catch7');
!function error() {
	try {
		try {
			throw new Error("oops");
		} catch (ex) {
			console.error("inner", ex.message);
			return "aaa";
		} finally {
			console.log("finally");
			throw new Error("oops111");
		}
	} catch (ex) {
		console.error("outer", ex.message);
	}
}()

console.log('try...catch8');
!function error() {
	try {
		try {
			throw new Error("oops");
		} catch (ex) {
			console.error("inner", ex.message);
			throw ex;
		} finally {
			console.log("finally");
			throw new Error("oops111");
		}
	} catch (ex) {
		console.error("outer", ex.message);
	}
}()
console.log('try...catch9');
function error() {
	try {
		try {
			return 'test'
		} catch (ex) {
			console.error("inner", ex.message);
			throw ex;
		} finally {
			console.log("finally");
		}
	} catch (ex) {
		console.error("outer", ex.message);
	}
}

console.log(error())

//switch
console.log('switch1')
var ui = 0;
switch('b') {
    case 'b':
        ui = 'b';
        break;
    case 'a':
        ui = 'a'
    case 'a1':
        ui += 'a1'
    default:
        ui = 'def';
}
console.log(ui)
console.log('switch2')
var ui = 0;
switch('a') {
    case 'b':
        ui = 'b';
        break;
    case 'a':
        ui = 'a'
    case 'a1':
        ui += 'a1'
    default:
        ui = 'def';
}
console.log(ui)
console.log('switch3')
var ui = 0;
switch('c') {
    case 'b':
        ui = 'b';
        break;
    case 'a':
        ui = 'a'
    case 'a1':
        ui += 'a1'
    default:
        ui = 'def';
}
console.log(ui)

//object getter setter
console.log('getter/setter1')
var d = {
    _name: 'nobo',
    get name(){
        return this._name;
    },
    set name(b) {
        this._name = b
    }
}
console.log(d.name);
d.name = 'accd';
console.log(d.name);

console.log('getter/setter2')
var d = {
    _name: 'nobo',
    get name(){
        return this._name;
    },

    name : 'nobox',

    set name(b) {
        this._name = b
    }
}
console.log(d.name);
d.name = 'accd';
console.log(d.name);
console.log(d._name);

console.log('getter/setter3')
var d = {
    _name: 'nobo',
    get name(){
        return this._name;
    },

    name : 'nobox',

    get name() {
      return  this._name 
    }
}
console.log(d.name);
d.name = 'accd';
console.log(d.name);
console.log(d._name);

console.log('getter/setter4')
var d = {
    _name: 'nobo',
    get name(){
        return this._name;
    },

    set name(a) {
        this._name = a
    },

    name : 'nobox',
}
console.log(d.name);
d.name = 'accd';
console.log(d.name);
console.log(d._name);

//label


label: console.log('label'),23

if(1) {
    ;
}

//label
console.log('label-break1');
foo: {
  console.log('face');
  foo2: {
      console.log('face1');
      break foo;
  }
  console.log('this will not be executed');
}
console.log('swap');

console.log('label-break2');
f1: for(var i = 0 ; i< 3 ; i++) {
    f2: {
        if(i === 1) {
            1
            break f2;
        }
        console.log(i);
    }
}
console.log('label-break3');
var i, j;

    loop1:
    for (i = 0; i < 3; i++) {      //The first for statement is labeled "loop1"
     
          if (i === 1 ) {
             break loop1;
          }
          console.log('i = ' + i);
       }

console.log('label-break4');
var i, j;

loop1:
for (i = 0; i < 3; i++) {      //The first for statement is labeled "loop1"
   loop2:
   for (j = 0; j < 3; j++) {   //The second for statement is labeled "loop2"
      if (i == 1 && j == 1) {
         break loop1;
      }
      console.log("i = " + i + ", j = " + j);
   }
}


console.log('label-continue1');
var i, j;

    loop1:
    for (i = 0; i < 3; i++) {      //The first for statement is labeled "loop1"
     
          if (i === 1 ) {
             continue loop1;
          }
          console.log('i = ' + i);
       }

console.log('label-continue2');
var i, j;

    loop1:
    for (i = 0; i < 3; i++) {      //The first for statement is labeled "loop1"
      
       for (j = 0; j < 3; j++) {   //The second for statement is labeled "loop2"
          if (i === 1 && j === 1) {
             continue loop1;
          }
          console.log('i = ' + i + ', j = ' + j);
       }
    }

console.log('label-continue3');
var i = 0, 
    j = 8;

checkiandj: while (i < 4) {
   console.log("i: " + i);
   i += 1;

   checkj: while (j > 4) {
      console.log("j: "+ j);
      j -= 1;
      if ((j % 2) == 0)
         continue checkj;
      console.log(j + " is odd.");
   }
   console.log("i = " + i);
   console.log("j = " + j);
}

// function throwError(){
//     throw 'error tst'
// }

// throwError();

123
function acc(){}
var a=1;

// console.log('hello world!', f1)
`;

const code2 = `
var s345 = adsf12

// try{ test() } catch(e) { console.log(e) }



222

// try{
// aa()

// throw 'asd'
// } catch(e){
//   //  console.log(e)
// }


// var a += 2

// asdfdf &= 2
// var s = {a:45}

// s.v

var a = {b:1}
// a.c()
var counter; 
for(var i = 0; i< 1000000; i++) {
    counter = i;
}
`;

const code3 = `
try{
    var a = asdfasdf;
} catch(e) {
    console.log(a);
}
`;

const code4 = `


var s = {}
opp += 1

function f(){}

new f(a, a23+=3)

var a,b

f(a,b,c1)

typeof null.radf

var s = null;
++s.a1


++a.b

var a1 = null
typeof a1.b.c.d

try {
switch(1) {
    case asdf:;
}
} catch(e){}

var d = {a:1};
for(a.b.c in d3);

for(;1; xxxx1) ;
if(xxx) {}

a=1,b+=3,12

d = {s:1}
d.c.c();

var ac = [1,2,3, a00]
var s = {a:a11}
+afad
// var i = 1;
// i < adafda
//  for(var i = 1; i < adasdf;i++) {}
// for(var i = 1; i < 2;adf++) {}
// for(var i = adfasdf; 0;i++) {}
`;

const code5 = `

function f1(a,b){
    console.log(a,b)
}

var a,b,c;
a=1
b=2
c=3

f1(4,5)

Array(5)


`;

var interpreter = new Interpreter(
	global,
	// {
	// 	Math,
	// 	Array,
	// 	Date,
	// 	test: function() {
	// 		return Interpreter.throw("test out error");
	// 	},
	// 	console,
	// 	Error,
	// },
	{
		// timeout: 1000,
	}
);

var code6 = `
var restArguments = function restArguments(func, startIndex) {
    startIndex = startIndex == null ? func.length - 1 : +startIndex;
    console.log(func.length, 'func.length')
    return function fff() {
        var length = Math.max(arguments.length - startIndex, 0),
            rest = Array(length),
            index = 0;
        for (; index < length; index++) {
            rest[index] = arguments[index + startIndex];
        }

        switch (startIndex) {
            case 0:
                return func.call(this, rest);
            case 1:
                return func.call(this, arguments[0], rest);
            case 2:
                return func.call(this, arguments[0], arguments[1], rest);
        }
        var args = Array(startIndex + 1);
        for (index = 0; index < startIndex; index++) {
            args[index] = arguments[index];
        }
        args[startIndex] = rest;
        console.log(args, "restArguments");
        return func.apply(this, args);
    };
};

var t11 = restArguments(function scc(a,b,c,d){ console.log('run', arguments); return 1445 }, 1)
console.log(t11(1,2,3,4))
`;

const code7 = `
${jsCode + ""}
_.difference([1, 2, 3, 4, 5], [5, 2, 10]);
_.groupBy([1.3, 2.1, 2.4], function(num){ return Math.floor(num); });
var stooges = [{name: 'moe', age: 40}, {name: 'larry', age: 50}, {name: 'curly', age: 60}];
_.indexBy(stooges, 'age');
var list = [[0, 1], [2, 3], [4, 5]];
_.reduceRight(list, function(a, b) { return a.concat(b); }, []);
var compiled = _.template("hello: <%= name %>");
compiled({name: 'moe'});
`;
// ${ acornCode + "" }
const code8 = `${acornCode + ""}
acorn.parse("1+1")
`;

// typeof test
const code9 = `

function test(){
    return 123
}

var ad = {a:{b:'af'}}

console.log(typeof ad.a.b)


console.log(delete null.ac)
console.log(typeof ad.ba)
console.log(typeof null.ba)
console.log(delete ad1)

console.log(typeof test())

`;

const code10 = `

function f(){
    try {
    console.log('f call', abc)
    } catch(err) {
        console.log('test', 123, err);
    }
}

f()

`;

const result = interpreter.evaluate(code10);

console.log("exec: " + interpreter.getExecutionTime() + "ms");

if (interpreter.getError()) {
	console.log(interpreter.getErrorMessage());
}
console.log("output:", result);

// const vm = require("vm");

// try {
// 	vm.runInNewContext(
// 		"try{new Date('2014-25-23').toISOString();} catch(e) { console.log(e) }",
// 		{ console },
// 		{ timeout: 5 }
// 	);
// } catch (e) {
// 	console.log(String(e));
// }
