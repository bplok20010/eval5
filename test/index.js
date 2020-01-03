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
  console.log(i)
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
// console.log('hello world!', f1)
`;

var interpreter = new Interpreter({ Array, Date, console, Error });

const result = interpreter.evaluate(code);

console.log("output:", result);

// console.log(error());
