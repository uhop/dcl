/* UMD.define */ (typeof define=="function"&&define||function(d,f,m){m={module:module,require:require};module.exports=f.apply(null,d.map(function(n){return m[n]||require(n)}))})
(["module", "heya-unit", "../dcl", "../inherited"], function(module, unit, dcl){

	// tests

	unit.add(module, [
		function test_inherited_with_superCalls(t){
			var A = dcl(null, {
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

			var B = dcl(A, {
				m2: function(){
					this.inherited(arguments);
					if(!this.c){ this.c = ""; }
					this.c += "2";
				},
				m3: function(){
					if(!this.d){ this.d = ""; }
					this.d += "N";
					this.inherited(arguments);
				}
			});

			var b = new B;
			b.m2();
			b.m3();
			eval(t.TEST('b.c === "12"'));
			eval(t.TEST('b.d === "NM"'));

			var C = dcl(B, {
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
			c.m2();
			c.m3();
			eval(t.TEST('c.c === "123"'));
			eval(t.TEST('c.d === "ONM"'));
		},
		function test_inherited(t){
			var A = dcl(null, {
				m2: function(){
					this.inherited(A, "m2", []);
					if(!this.c){ this.c = ""; }
					this.c += "1";
				},
				m3: function(){
					if(!this.d){ this.d = ""; }
					this.d += "M";
					this.inherited(arguments);
				}
			});

			var a = new A;
			a.m2();
			a.m3();
			eval(t.TEST('a.c === "1"'));
			eval(t.TEST('a.d === "M"'));

			var B = dcl(A, {
				m2: function(){
					this.inherited(arguments);
					if(!this.c){ this.c = ""; }
					this.c += "2";
				},
				m3: function(){
					if(!this.d){ this.d = ""; }
					this.d += "N";
					this.inherited(B, "m3", []);
				}
			});

			var b = new B;
			b.m2();
			b.m3();
			eval(t.TEST('b.c === "12"'));
			eval(t.TEST('b.d === "NM"'));

			var C = dcl(B, {
				m2: function(){
					this.inherited(C, "m2", []);
					if(!this.c){ this.c = ""; }
					this.c += "3";
				},
				m3: function(){
					if(!this.d){ this.d = ""; }
					this.d += "O";
					this.inherited(arguments);
				}
			});

			var c = new C;
			c.m2();
			c.m3();
			eval(t.TEST('c.c === "123"'));
			eval(t.TEST('c.d === "ONM"'));
		},
		function test_inherited_with_intrinsics_1(t){
			var a = new (dcl(null, {
				toString: function(){
					return "PRE-" + this.inherited(arguments) + "-POST";
				}
			}));
			eval(t.TEST('a.toString() === "PRE-[object Object]-POST"'));
		},
		function test_inherited_with_intrinsics_2(t){
			"use strict";
			var A = dcl(null, {
				toString: function(){
					return "PRE-" + this.inherited(A, "toString", arguments) + "-POST";
				}
			});
			var a = new A;
			eval(t.TEST('a.toString() === "PRE-[object Object]-POST"'));
		}
	]);

	return {};
});
