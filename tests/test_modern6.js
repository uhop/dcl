'use strict';


var dcl = require('../modern');


var A = dcl(null, {
		z: function (x) {
			return x + 'a';
		}
	});

var x = new A;
console.log(x);
console.log(x instanceof A);
console.log(x.z);
console.log(x.z(1));

var B = dcl(A, {
		z: dcl.superCall(function (sup) {
			return function (x) {
				return sup.call(this, x + '|>') + '<|' + x;
			};
		})
	});

x = new A;
console.log(x);
console.log(x instanceof A);
console.log(x.z);
console.log(x.z(1));

var y = new B;
console.log(y);
console.log(y instanceof A);
console.log(y.z);
console.log(y.z(1));
