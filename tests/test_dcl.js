/* UMD.define */ (typeof define=="function"&&define||function(d,f,m){m={module:module,require:require};module.exports=f.apply(null,d.map(function(n){return m[n]||require(n)}))})
(["module", "heya-unit", "../dcl"], function(module, unit, dcl){

	"use strict";

	// tests

	unit.add(module, [
		function test_chaining(t){
			"use strict";

			var A = dcl(null, {});
			dcl.chainBefore(A, "m1");
			dcl.chainAfter(A, "m2");

			var B = dcl(null, {
				m1: function(){
					if(!this.b){ this.b = ""; }
					this.b += "B";
				},
				m2: function(){
					if(!this.c){ this.c = ""; }
					this.c += "B";
				}
			});

			var C = dcl(null, {
				m1: function(){
					if(!this.b){ this.b = ""; }
					this.b += "C";
				},
				m2: function(){
					if(!this.c){ this.c = ""; }
					this.c += "C";
				}
			});

			var D = dcl(null, {
				m1: function(){
					if(!this.b){ this.b = ""; }
					this.b += "D";
				},
				m2: function(){
					if(!this.c){ this.c = ""; }
					this.c += "D";
				}
			});

			var ABCD = dcl([A, B, C, D], {});
			var x = new ABCD;
			x.m1();
			x.m2();

			eval(t.TEST('x.b === "DCB"'));
			eval(t.TEST('x.c === "BCD"'));
		},
		function test_chain_with_super(t){
			"use strict";

			var A = dcl(null, {
				constructor: function(){
					this.reset();
					this.flag = true;
				},
				reset: function(){
					this.b = this.c = "";
				},
				m1: function(){
					this.b += "A";
				},
				m2: function(){
					this.c += "A";
				}
			});
			dcl.chainBefore(A, "m1");
			dcl.chainAfter(A, "m2");

			var B = dcl(null, {
				m1: function(){
					this.b += "B";
				},
				m2: function(){
					this.c += "B";
				}
			});

			var C = dcl(null, {
				m1: dcl.superCall(function(sup){
					return function(){
						this.b += "Cb";
						if(this.flag && sup){ sup.call(this); }
						this.b += "Ca";
					};
				}),
				m2: dcl.superCall(function(sup){
					return function(){
						this.c += "Cb";
						if(this.flag && sup){ sup.call(this); }
						this.c += "Ca";
					};
				})
			});

			var D = dcl(null, {
				m1: function(){
					this.b += "D";
				},
				m2: function(){
					this.c += "D";
				}
			});

			var E = dcl(null, {
				m1: function(){
					this.b += "E";
				},
				m2: function(){
					this.c += "E";
				}
			});

			var x = new (dcl([A, B, C, D, E], {}));
			x.m1();
			x.m2();

			eval(t.TEST('x.b === "EDCbBACa"'));
			eval(t.TEST('x.c === "CbABCaDE"'));

			x.reset();
			x.flag = false;
			x.m1();
			x.m2();

			eval(t.TEST('x.b === "EDCbCa"'));
			eval(t.TEST('x.c === "CbCaDE"'));
		},
		function test_isInstanceOf(t){
			"use strict";

			var A = dcl(null, {});
			var B = dcl(null, {});
			var C = dcl(null, {});
			var D = dcl(null, {});

			var AC = dcl([A, C], {});
			var BD = dcl([B, D], {});

			var x = new AC, y = new BD;

			eval(t.TEST('dcl.isInstanceOf(x, A)'));
			eval(t.TEST('!dcl.isInstanceOf(x, B)'));
			eval(t.TEST('dcl.isInstanceOf(x, C)'));
			eval(t.TEST('!dcl.isInstanceOf(x, D)'));

			eval(t.TEST('!dcl.isInstanceOf(y, A)'));
			eval(t.TEST('dcl.isInstanceOf(y, B)'));
			eval(t.TEST('!dcl.isInstanceOf(y, C)'));
			eval(t.TEST('dcl.isInstanceOf(y, D)'));
		},
		function test_postscript(t){
			var A = dcl(null, {
				constructor: dcl.advise({
					around: function(sup){
						return function(){
							if(!this.a){ this.a = ""; }
							this.a += "A";
						};
					},
					after: function(){
						this.postscript();
					}
				}),
				postscript: function(){
					this.b = "A";
				}
			});

			var B = dcl(null, {
				constructor: function(){
					if(!this.a){ this.a = ""; }
					this.a += "B";
				},
				postscript: function(){
					this.b = "B";
				}
			});

			var C = dcl(null, {
				constructor: function(){
					if(!this.a){ this.a = ""; }
					this.a += "C";
				},
				postscript: function(){
					this.b = "C";
				}
			});

			var x = new (dcl(A, {}));
			eval(t.TEST('x.a === "A"'));
			eval(t.TEST('x.b === "A"'));

			var y = new (dcl([A, B], {}));
			eval(t.TEST('y.a === "AB"'));
			eval(t.TEST('y.b === "B"'));

			var z = new (dcl([A, B, C], {}));
			eval(t.TEST('z.a === "ABC"'));
			eval(t.TEST('z.b === "C"'));
		},
		function test_postscript2(t){
			"use strict";

			var A = dcl(null, {
				constructor: dcl.advise({
					around: function(sup){
						return function(){
							if(!this.a){ this.a = ""; }
							this.a += "A";
						};
					},
					after: function(){
						this.postscript();
					}
				}),
				postscript: function(){
					if(!this.a){ this.a = ""; }
					this.a += "P";
				}
			});

			var B = dcl(null, {
				constructor: function(){
					if(!this.a){ this.a = ""; }
					this.a += "B";
				}
			});

			var C = dcl(null, {
				constructor: function(){
					if(!this.a){ this.a = ""; }
					this.a += "C";
				}
			});

			var x = new (dcl(A, {}));
			eval(t.TEST('x.a === "AP"'));

			var y = new (dcl([A, B], {}));
			eval(t.TEST('y.a === "ABP"'));

			var z = new (dcl([A, B, C], {}));
			eval(t.TEST('z.a === "ABCP"'));

			var m = new (dcl([B, A], {}));
			eval(t.TEST('m.a === "AP"'));

			var n = new (dcl([C, A, B], {}));
			eval(t.TEST('n.a === "ABP"'));
		},
		function test_advise(t){
			"use strict";

			var A = dcl(null, {
				m1: dcl.advise({
					after: function(){
						if(!this.a){ this.a = ""; }
						this.a += "Aa";
					}
				})
			});
			var B = dcl(null, {
				m1: dcl.advise({
					before: function(){
						if(!this.a){ this.a = ""; }
						this.a += "Bb";
					}
				})
			});
			var C = dcl(null, {
				m1: dcl.superCall(function(sup){
					return function(){
						if(!this.a){ this.a = ""; }
						this.a += "Cfb";
						if(sup){
							sup.apply(this, arguments);
						}
						this.a += "Cfa";
					};
				})
			});
			var D = dcl(null, {
				m1: dcl.advise({
					before: function(){
						if(!this.a){ this.a = ""; }
						this.a += "Db";
					},
					around: function(sup){
						return function(){
							if(!this.a){ this.a = ""; }
							this.a += "Dfb";
							if(sup){
								sup.apply(this, arguments);
							}
							this.a += "Dfa";
						};
					},
					after: function(){
						if(!this.a){ this.a = ""; }
						this.a += "Da";
					}
				})
			});
			var E = dcl(null, {
				m1: function(){
					if(!this.a){ this.a = ""; }
					this.a += "E";
				}
			});

			var x = new (dcl([E, A, B, C, D], {}));
			x.m1();
			eval(t.TEST('x.a === "DbBbDfbCfbECfaDfaAaDa"'));

			var y = new (dcl([A, B, C, D, E], {}));
			y.m1();
			eval(t.TEST('y.a === "DbBbEAaDa"'));
		},
		function test_advise2(t){
			"use strict";

			var A = dcl(null, {
				m1: dcl.advise({
					before: function(){
						if(!this.a){ this.a = ""; }
						this.a += "Ab";
					},
					after: function(){
						if(!this.a){ this.a = ""; }
						this.a += "Aa";
					}
				})
			});
			var B = dcl(null, {
				m1: dcl.advise({
					before: function(){
						if(!this.a){ this.a = ""; }
						this.a += "Bb";
					},
					after: function(){
						if(!this.a){ this.a = ""; }
						this.a += "Ba";
					}
				})
			});

			var x = new (dcl([A, B], {}));
			x.m1();
			eval(t.TEST('x.a === "BbAbAaBa"'));

			var y = new (dcl([B, A], {}));
			y.m1();
			eval(t.TEST('y.a === "AbBbBaAa"'));
		}
	]);

	return {};
});
