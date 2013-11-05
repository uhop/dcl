/* UMD.define */ (typeof define=="function"&&define||function(d,f,m){m={module:module,require:require};module.exports=f.apply(null,d.map(function(n){return m[n]||require(n)}))})
(["module", "heya-unit", "../dcl", "../advise", "../advices/counter", "../advices/flow",
	"../advices/time", "../advices/memoize", "../advices/trace"],
function(module, unit, dcl, advise, counter, flow, time, memoize, trace){

	"use strict";

	var Ackermann = dcl(null, {
		declaredName: "Ackermann",
		m0: function(n){
			return n + 1;
		},
		n0: function(m){
			return this.a(m - 1, 1);
		},
		a: function(m, n){
			if(m == 0){
				return this.m0(n);
			}
			if(n == 0){
				return this.n0(m);
			}
			return this.a(m - 1, this.a(m, n - 1));
		}
	});

	// tests

	unit.add(module, [
		function test_counter(t){
			"use strict";

			var x = new Ackermann();

			var counterM0 = counter();
			advise(x, "m0", counterM0.advice());

			var counterN0 = counter();
			advise(x, "n0", counterN0.advice());

			var counterA = counter();
			advise(x, "a", counterA.advice());

			x.a(3, 2);

			eval(t.TEST("counterM0.calls  === 258"));
			eval(t.TEST("counterM0.errors === 0"));
			eval(t.TEST("counterN0.calls  === 26"));
			eval(t.TEST("counterN0.errors === 0"));
			eval(t.TEST("counterA .calls  === 541"));
			eval(t.TEST("counterA .errors === 0"));
		},
		{
			test: function test_flow(t){
				"use strict";

				// our advised version:
				var AdvisedAckermann = dcl(Ackermann, {
						declaredName: "AdvisedAckermann",
						m0: dcl.advise(flow.advice("m0")),
						n0: dcl.advise(flow.advice("n0")),
						a:  dcl.advise(flow.advice("a"))
					});

				// our instrumented version:
				var InstrumentedAckermann = dcl(AdvisedAckermann, {
						declaredName: "InstrumentedAckermann",
						m0: dcl.around(function(sup){
							return function(n){
								t.info("a() called: " + (flow.inFlowOf("a") || 0));
								t.info("n0() called: " + (flow.inFlowOf("n0") || 0));
								var stack = flow.getStack();
								var previous = stack[stack.length - 2] || "(none)";
								t.info("m0() called from: " + previous);
								return sup.call(this, n);
							}
						})
					});

				var x = new InstrumentedAckermann();
				x.a(1, 1);
			},
			logs: [
				{text: "a() called: 3"},
				{text: "n0() called: 1"},
				{text: "m0() called from: a"},
				{text: "a() called: 2"},
				{text: "n0() called: 0"},
				{text: "m0() called from: a"}
			]
		},
		function test_memoize(t){
			"use strict";

			// TODO: redirect console to ice

			if(console.time && console.timeEnd){
				var x = new Ackermann();

				advise(x, "a", time("x.a"));

				x.a(3, 3);
				x.a(3, 3);

				var y = new Ackermann();

				advise(y, "m0", memoize.advice("m0"));
				advise(y, "n0", memoize.advice("n0"));
				advise(y, "a",  memoize.advice("a", function(self, args){
					return args[0] + "-" + args[1];
				}));

				advise(y, "a", time("y.a"));

				y.a(3, 3);
				y.a(3, 3);
			}
		},
		function test_trace(t){
			"use strict";

			// TODO: redirect console to ice

			// our instance:
			var x = new Ackermann();

			advise(x, "m0", trace("m0", true));
			advise(x, "n0", trace("n0", true));
			advise(x, "a",  trace("a",  true));

			x.a(1, 1);
		}
	]);

	return {};
});
