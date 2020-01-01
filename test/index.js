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


// console.log('hello world!', f1)

`;
new Interpreter(code, { context: { Array, Date, console } });
