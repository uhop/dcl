/* UMD.define */ (typeof define=="function"&&define||function(d,f,m){m={module:module,require:require};module.exports=f.apply(null,d.map(function(n){return m[n]||require(n)}))})
(["module", "heya-unit", "../dcl", "../inherited"], function(module, unit, dcl){

	"use strict";

	// tests

	unit.add(module, [
		{
			test: function test_si(t){
				"use strict";

				function A(x){ t.info("A: " + x); }
				A.prototype = {
					m: function(x){ t.info("A.m: " + x); }
				};

				var a = new A(1);
				a.m(2);

				var B = dcl(A, {
						constructor: function(x){
							t.info("B: " + x);
						},
						m: function(x){
							t.info("B.m: " + x);
						}
					});

				var b = new B(3);
				b.m(4);
			},
			logs: [
				{text: "A: 1"},
				{text: "A.m: 2"},
				{text: "A: 3"},
				{text: "B: 3"},
				{text: "B.m: 4"}
			]
		},
		{
			test: function test_superCall(t){
				"use strict";

				function A(x){ t.info("A: " + x); }
				A.prototype = {
					m: function(x){ t.info("A.m: " + x); }
				};

				var a = new A(1);
				a.m(2);

				var B = dcl(A, {
						constructor: function(x){
							t.info("B: " + x);
						},
						m: dcl.superCall(function(sup){
							return function(x){
								t.info("B.m before: " + x);
								sup.apply(this, arguments);
								t.info("B.m middle: " + x);
								sup.call(this, x + 1);
								t.info("B.m after: " + x);
							};
						})
					});

				var b = new B(3);
				b.m(4);
			},
			logs: [
				{text: "A: 1"},
				{text: "A.m: 2"},
				{text: "A: 3"},
				{text: "B: 3"},
				{text: "B.m before: 4"},
				{text: "A.m: 4"},
				{text: "B.m middle: 4"},
				{text: "A.m: 5"},
				{text: "B.m after: 4"}
			]
		},
		function test_superCall_int(t){
			"use strict";

			function A(x){}
			A.prototype = {
				toString: function(x){ return "[object A]"; }
			};

			var b = new (dcl(A, {
					toString: dcl.superCall(function(sup){
						return function(){
							return "PRE-" + sup.call(this) + "-POST";
						};
					})
				}));
			eval(t.TEST('b.toString() === "PRE-[object A]-POST"'));
		},
		{
			test: function test_inherited(t){
				"use strict";

				function A(x){ t.info("A: " + x); }
				A.prototype = {
					m: function(x){ t.info("A.m: " + x); }
				};

				var a = new A(1);
				a.m(2);

				var B = dcl(A, {
					constructor: function(x){
						t.info("B: " + x);
					},
					m: function(x){
						t.info("B.m before: " + x);
						this.inherited(this.constructor, "m", arguments);
						t.info("B.m middle: " + x);
						this.inherited(this.constructor, "m", [x + 1]);
						t.info("B.m after: " + x);
					}
				});

				var b = new B(3);
				b.m(4);
			},
			logs: [
				{text: "A: 1"},
				{text: "A.m: 2"},
				{text: "A: 3"},
				{text: "B: 3"},
				{text: "B.m before: 4"},
				{text: "A.m: 4"},
				{text: "B.m middle: 4"},
				{text: "A.m: 5"},
				{text: "B.m after: 4"}
			]
		},
		function test_inherited_int(t){
			"use strict";

			function A(x){}
			A.prototype = {
				toString: function(x){ return "[object A]"; }
			};

			var b = new (dcl(A, {
					toString: function(){
						return "PRE-" + this.inherited(this.constructor, "toString", []) + "-POST";
					}
				}));
			eval(t.TEST('b.toString() === "PRE-[object A]-POST"'));
		},
		{
			test: function test_mi(t){
				"use strict";

				function A(x){ t.info("A: " + x); }
				A.prototype = {
					m1: function(x){ t.info("A.m1: " + x); },
					m2: function(x){ t.info("A.m2: " + x); },
					m3: function(x){ t.info("A.m3: " + x); }
				};

				function B(x){ t.info("B: " + x); }
				B.prototype = {
					m1: function(x){ t.info("B.m1: " + x); },
					m2: function(x){ t.info("B.m2: " + x); },
					m3: function(x){ t.info("B.m3: " + x); }
				};

				function C(x){ t.info("C: " + x); }
				C.prototype = {
					m1: function(x){ t.info("C.m1: " + x); },
					m2: function(x){ t.info("C.m2: " + x); },
					m3: function(x){ t.info("C.m3: " + x); }
				};

				var abc = new (dcl([A, B, C], {
						constructor: function(x){
							t.info("abc: " + x);
						},
						m1: dcl.superCall(function(sup){
							return function(x){
								t.info("abc.m1: " + x);
								sup.call(this, x);
							};
						}),
						m2: dcl.superCall(function(sup){
							return function(x){
								t.info("abc.m2: " + x);
								sup.call(this, x);
							};
						}),
						m3: dcl.superCall(function(sup){
							return function(x){
								t.info("abc.m3: " + x);
								sup.call(this, x);
							};
						})
					}))(0);
				abc.m1(1);
				abc.m2(2);
				abc.m3(3);

				var O = dcl(null, {});
				dcl.chainBefore(O, "m1");
				dcl.chainAfter(O, "m3");

				var oabc = new (dcl([O, A, B, C], {
						constructor: function(x){
							t.info("oabc: " + x);
						},
						m1: function(x){
							t.info("oabc.m1: " + x);
						},
						m2: function(x){
							t.info("oabc.m2: " + x);
						},
						m3: function(x){
							t.info("oabc.m3: " + x);
						}
					}))(0);
				oabc.m1(1);
				oabc.m2(2);
				oabc.m3(3);
			},
			logs: [
				// abc
				{text: "A: 0"},
				{text: "B: 0"},
				{text: "C: 0"},
				{text: "abc: 0"},
				{text: "abc.m1: 1"},
				{text: "C.m1: 1"},
				{text: "abc.m2: 2"},
				{text: "C.m2: 2"},
				{text: "abc.m3: 3"},
				{text: "C.m3: 3"},
				// oabc
				{text: "A: 0"},
				{text: "B: 0"},
				{text: "C: 0"},
				{text: "oabc: 0"},
				{text: "oabc.m1: 1"},
				{text: "C.m1: 1"},
				{text: "B.m1: 1"},
				{text: "A.m1: 1"},
				{text: "oabc.m2: 2"},
				{text: "A.m3: 3"},
				{text: "B.m3: 3"},
				{text: "C.m3: 3"},
				{text: "oabc.m3: 3"}
			]
		}
	]);

	return {};
});
