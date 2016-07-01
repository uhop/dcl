var dcl = require("../dcl");


var A = dcl(null, {
		constructor: function(){
			console.log("A::ctr");
		}
	});

var M = dcl(null, {
		constructor: dcl.advise({
			before: function(){
				console.log("M::before");
			},
			after: function(){
				console.log("M::after");
			}
		})
	});

var C = dcl([A, M], {
		constructor: function(){
			console.log("B::ctr");
		}
	});

var c = new C();
