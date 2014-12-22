/* UMD.define */ (typeof define=="function"&&define||function(d,f,m){m={module:module,require:require};module.exports=f.apply(null,d.map(function(n){return m[n]||require(n)}))})
(["module", "heya-unit", "../mini"], function(module, unit, dcl){

	"use strict";

	function getNames(ctor){
		var b = ctor._meta.bases, r = [];
		for(var i = 0, l = b.length; i < l; ++i){
			r.push(b[i].prototype.declaredClass);
		}
		return r.join(",");
	}

	// tests

	unit.add(module, [
		function test_si(t){
			"use strict";
			var A = dcl(null, {declaredClass: "A"});
			var B = dcl(A, {declaredClass: "B"});
			var C = dcl(B, {declaredClass: "C"});
			eval(t.TEST('getNames(A) === "A"'));
			eval(t.TEST('getNames(B) === "B,A"'));
			eval(t.TEST('getNames(C) === "C,B,A"'));
		},
		function test_superCall(t){
			"use strict";

			var A = dcl(null, {
				constructor: function(){
					if(!this.a){ this.a = ""; }
					this.a += "A";
				},
				m1: function(){
					this.b = "X";
				},
				m2: dcl.superCall(function(sup){
					return function(){
						if(sup){ sup.call(this); }
						if(!this.c){ this.c = ""; }
						this.c += "1";
					};
				}),
				m3: dcl.superCall(function(sup){
					return function(){
						if(!this.d){ this.d = ""; }
						this.d += "M";
						if(sup){ sup.call(this); }
					};
				})
			});

			var a = new A;
			a.m1();
			a.m2();
			a.m3();
			eval(t.TEST('a.a === "A"'));
			eval(t.TEST('a.b === "X"'));
			eval(t.TEST('a.c === "1"'));
			eval(t.TEST('a.d === "M"'));

			var B = dcl(A, {
				constructor: function(){
					if(!this.a){ this.a = ""; }
					this.a += "B";
				},
				m1: function(){
					this.b = "Y";
				},
				m2: dcl.superCall(function(sup){
					return function(){
						if(sup){ sup.call(this); }
						if(!this.c){ this.c = ""; }
						this.c += "2";
					};
				}),
				m3: dcl.superCall(function(sup){
					return function(){
						if(!this.d){ this.d = ""; }
						this.d += "N";
						if(sup){ sup.call(this); }
					};
				})
			});

			var b = new B;
			b.m1();
			b.m2();
			b.m3();
			eval(t.TEST('b.a === "AB"'));
			eval(t.TEST('b.b === "Y"'));
			eval(t.TEST('b.c === "12"'));
			eval(t.TEST('b.d === "NM"'));

			var C = dcl(B, {
				constructor: function(){
					if(!this.a){ this.a = ""; }
					this.a += "C";
				},
				m1: function(){
					this.b = "Z";
				},
				m2: dcl.superCall(function(sup){
					return function(){
						if(sup){ sup.call(this); }
						if(!this.c){ this.c = ""; }
						this.c += "3";
					};
				}),
				m3: dcl.superCall(function(sup){
					return function(){
						if(!this.d){ this.d = ""; }
						this.d += "O";
						if(sup){ sup.call(this); }
					};
				})
			});

			var c = new C;
			c.m1();
			c.m2();
			c.m3();
			eval(t.TEST('c.a === "ABC"'));
			eval(t.TEST('c.b === "Z"'));
			eval(t.TEST('c.c === "123"'));
			eval(t.TEST('c.d === "ONM"'));
		},
		function test_diamonds(t){
			"use strict";

			var A = dcl(null, {declaredClass: "A"});
			var B = dcl(null, {declaredClass: "B"});
			var C = dcl(null, {declaredClass: "C"});
			var D = dcl(null, {declaredClass: "D"});

			var ABC = dcl([A, B, C], {declaredClass: "ABC"});
			var ADC = dcl([A, D, C], {declaredClass: "ADC"});

			eval(t.TEST('getNames(ABC) === "ABC,C,B,A"'));
			eval(t.TEST('getNames(ADC) === "ADC,C,D,A"'));

			var ABCD1 = dcl([ABC, ADC], {declaredClass: "ABCD1"});
			var ABCD2 = dcl([ADC, ABC], {declaredClass: "ABCD2"});

			eval(t.TEST('getNames(ABCD1) === "ABCD1,ADC,ABC,C,D,B,A"'));
			eval(t.TEST('getNames(ABCD2) === "ABCD2,ABC,ADC,C,B,D,A"'));
		},
		function test_triangles(t){
			"use strict";

			var A = dcl(null, {declaredClass: "A"});
			var B = dcl(null, {declaredClass: "B"});
			var C = dcl(null, {declaredClass: "C"});

			var ABC = dcl([A, B, C], {declaredClass: "ABC"});
			var AC = dcl([A, C], {declaredClass: "AC"});
			var BC = dcl([B, C], {declaredClass: "BC"});

			eval(t.TEST('getNames(ABC) === "ABC,C,B,A"'));
			eval(t.TEST('getNames(AC) === "AC,C,A"'));
			eval(t.TEST('getNames(BC) === "BC,C,B"'));

			var ABC1 = dcl([ABC, AC], {declaredClass: "ABC1"});
			var ABC2 = dcl([AC, ABC], {declaredClass: "ABC2"});

			eval(t.TEST('getNames(ABC1) === "ABC1,AC,ABC,C,B,A"'));
			eval(t.TEST('getNames(ABC2) === "ABC2,ABC,AC,C,B,A"'));

			var ABC3 = dcl([ABC, BC], {declaredClass: "ABC3"});
			var ABC4 = dcl([BC, ABC], {declaredClass: "ABC4"});

			eval(t.TEST('getNames(ABC3) === "ABC3,BC,ABC,C,B,A"'));
			eval(t.TEST('getNames(ABC4) === "ABC4,ABC,BC,C,B,A"'));
		},
		function test_superCall_int(t){
			"use strict";
			var a = new (dcl(null, {
				toString: dcl.superCall(function(sup){
					return function(){
						return "PRE-" + sup.call(this) + "-POST";
					};
				})
			}));
			eval(t.TEST('a.toString() === "PRE-[object Object]-POST"'));
		},
		function test_impossible(t){
			"use strict";

			var A = dcl(null, {declaredClass: "A"});
			var B = dcl(null, {declaredClass: "B"});

			var AB = dcl([A, B], {declaredClass: "AB"});
			var BA = dcl([B, A], {declaredClass: "BA"});

			var failed = false;
			try{
				var X = dcl([AB, BA], {declaredClass: "X"});
			}catch(e){
				failed = true;
			}finally{
				eval(t.TEST('failed'));
			}
		}
	]);

	return {};
});
