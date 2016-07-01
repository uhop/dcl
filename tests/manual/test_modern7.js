'use strict';


var dcl = require('../modern');


var A = dcl(null, {
		a: dcl.advise({
			before: function (x) { console.log('A.a:before', x); },
			after:  function (a) { console.log('A.a:after',  a[0]); },
			around: function (sup) {
				return function (x) {
					sup && sup.call(this, x);
					console.log('A.a:', x);
				};
			}
		}),
		b: dcl.advise({
			before: function (x) { console.log('A.b:before', x); },
			after:  function (a) { console.log('A.b:after',  a[0]); },
			around: function (sup) {
				return function (x) { console.log('A.b:', x); }
			}
		})
	});

var x = new A;
x.a(1);
x.b(2);

var B = dcl(A, {
		a: dcl.advise({
			before: function (x) { console.log('B.a:before', x); },
			after:  function (a) { console.log('B.a:after',  a[0]); },
			around: function (sup) {
				return function (x) {
					sup && sup.call(this, x);
					console.log('B.a:', x);
				};
			}
		}),
		b: function (x) { console.log('B.b:', x); }
	});

var y = new B;
y.a(1);
y.b(2);
