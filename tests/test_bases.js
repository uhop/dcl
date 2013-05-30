/* UMD.define */ (typeof define=="function"&&define||function(d,f,m){m={module:module,require:require};module.exports=f.apply(null,d.map(function(n){return m[n]||require(n)}))})
(["module", "heya-unit", "../dcl", "../bases/Mixer", "../bases/Replacer"],
function(module, unit, dcl, Mixer, Replacer){

	"use strict";

	// tests

	unit.add(module, [
		function test_Mixer(t){
			"use strict";

			var f = function(){}

			var A = dcl(Mixer, {
				declaredClass: "A",
				a: 1,
				b: "two",
				c: null,
				d: f
			});

			var x = new A({
				a: 5,
				b: false,
				f: f
			});

			eval(t.TEST('x.a === 5'));
			eval(t.TEST('x.b === false'));
			eval(t.TEST('x.c === null'));
			eval(t.TEST('x.d === f'));
			eval(t.TEST('x.f === f'));
		},
		function test_Replacer(t){
			"use strict";

			var f = function(){}

			var A = dcl(Replacer, {
				declaredClass: "A",
				a: 1,
				b: "two",
				c: null,
				d: f
			});

			var x = new A({
				a: 5,
				b: false,
				f: f
			});

			eval(t.TEST('x.a === 5'));
			eval(t.TEST('x.b === false'));
			eval(t.TEST('x.c === null'));
			eval(t.TEST('x.d === f'));
			eval(t.TEST('!("f" in x)'));
		}
	]);

	return {};
});
