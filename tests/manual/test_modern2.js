'use strict';


var dcl = require('../modern');


var A = dcl(null, {
		a: function () { console.log('a'); }
	});

var x = new A;
console.log(x);
console.log(x instanceof A);
console.log(x.a);
x.a();

var B = dcl(A, {
		b: function () { console.log('b'); }
	});

var y = new B;
console.log(y);
console.log(y instanceof A, y instanceof B);
console.log(y.a, y.b);
y.a();
y.b();

var C = dcl(B, {
		c: function () { console.log('c'); }
	});

var z = new C;
console.log(z);
console.log(z instanceof A, z instanceof B, z instanceof C);
console.log(z.a, z.b, z.c);
z.a();
z.b();
z.c();
