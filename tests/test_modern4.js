'use strict';


var dcl = require('../modern');


var A = dcl(null, {
		a: function () { console.log('a'); },
		z: function () { console.log('a'); }
	});
A._meta.after.z = 1;

var B = dcl(null, {
		b: function () { console.log('b'); },
		z: function () { console.log('b'); }
	});

var C = dcl([A, B], {
		c: function () { console.log('c'); },
		z: function () { console.log('c'); }
	});

var z = new C;
console.log(z);
console.log(z instanceof A, z instanceof B, z instanceof C);
console.log(z.a, z.b, z.c, z.z);
z.a();
z.b();
z.c();
z.z();
