/* UMD.define */ (typeof define=="function"&&define||function(d,f,m){m={module:module,require:require};module.exports=f.apply(null,d.map(function(n){return m[n]||require(n)}))})
(["module", "heya-unit", "../dcl", "../debug"], function(module, unit, dcl, dclDebug){

	"use strict";

	// tests

	unit.add(module, [
		function test_imposible_cycle(t){
			"use strict";
			var A = dcl(null, {
				declaredClass: "A"
			});

			var B = dcl(null, {
				declaredClass: "B"
			});

			var AB = dcl([A, B], {
				declaredClass: "AB"
			});

			var BA = dcl([B, A], {
				declaredClass: "BA"
			});

			try{
				var Impossible = dcl([AB, BA], {
					declaredClass: "Impossible"
				});
				// we should never be there
				t.assert(false, "cycle error should be triggered");
			}catch(e){
				eval(t.TEST('e instanceof dclDebug.DclError'));
				eval(t.TEST('e instanceof dclDebug.CycleError'));
			}
		},
		function test_chaining_conflict(t){
			"use strict";
			var A = dcl(null, {
				declaredClass: "A"
			});
			dcl.chainAfter(A, "m");

			var B = dcl(null, {
				declaredClass: "B"
			});
			dcl.chainBefore(B, "m");

			try{
				var ChainConflict = dcl([A, B], {
					declaredClass: "ChainConflict"
				});
				// we should never be there
				t.assert(false, "chain error is triggered");
			}catch(e){
				eval(t.TEST('e instanceof dclDebug.DclError'));
				eval(t.TEST('e instanceof dclDebug.ChainingError'));
			}
		},
		function test_chaining_error(t){
			"use strict";
			var A = dcl(null, {
				declaredClass: "A"
			});
			dcl.chainAfter(A, "m");

			try{
				dcl.chainBefore(A, "m");
				// we should never be there
				t.assert(false, "set chaining error is triggered");
			}catch(e){
				eval(t.TEST('e instanceof dclDebug.DclError'));
				eval(t.TEST('e instanceof dclDebug.SetChainingError'));
			}
		},
		function test_superCall_argument_error(t){
			"use strict";
			try{
				var A = dcl(null, {
					declaredClass: "A",
					m: dcl.superCall("Should be a function, but it is a string.")
				});
				// we should never be there
				t.assert(false, "supercall error is triggered");
			}catch(e){
				eval(t.TEST('e instanceof dclDebug.DclError'));
				eval(t.TEST('e instanceof dclDebug.SuperCallError'));
			}
		},
		function test_superCall_super_error(t){
			"use strict";
			var A = dcl(null, {
				declaredClass: "A",
				m: 42 // not a function
			});
			try{
				var B = dcl(A, {
					declaredClass: "B",
					m: dcl.superCall(function(sup){
						return sup ? sup.call(this) : 0;
					})
				});
				// we should never be there
				t.assert(false, "super error is triggered");
			}catch(e){
				eval(t.TEST('e instanceof dclDebug.DclError'));
				eval(t.TEST('e instanceof dclDebug.SuperError'));
			}
		},
		function test_superCall_wrapper(t){
			"use strict";
			try{
				var A = dcl(null, {
					declaredClass: "A",
					m: dcl.superCall(function(sup){
						return "Instead of a function I return a string.";
					})
				});
				// we should never be there
				t.assert(false, "super result error is triggered");
			}catch(e){
				eval(t.TEST('e instanceof dclDebug.DclError'));
				eval(t.TEST('e instanceof dclDebug.SuperResultError'));
			}
		}
	]);

	return {};
});
