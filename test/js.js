"use strict";
function test1(a, b) {}
var p = 6;
Object.defineProperty(test1, "length", {
	value: p,
	writable: false,
	enumerable: false,
	configurable: true,
});

Object.defineProperty(test1, "name", {
	value: "adfasd",
	writable: false,
	enumerable: false,
	configurable: true,
});

console.log(test1.length, test1.name);
