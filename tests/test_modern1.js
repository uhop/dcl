'use strict';


var dcl = require('../modern');


var A = dcl(null, {a: 1});

var x = new A;
console.log(x);
console.log(x instanceof A);
console.log(x.a);

var B = dcl(null, {
		constructor: function () {
			this.b = 2;
		},
		a: dcl.prop({value: 1})
	});

var y = new B;
console.log(y);
console.log(y instanceof B);
console.log(y.a, y.b);

var C = dcl(null, dcl.prop({
		constructor: {
			value: function () {
				this.b = 2;
			}
		},
		a: {
			value: 1
		}
	}));

var z = new C;
console.log(z);
console.log(z instanceof C);
console.log(z.a, z.b);
