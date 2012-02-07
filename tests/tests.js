// test harness

if(typeof out == "undefined"){
	out = function(msg, isError){
		if(isError){
			msg = "*** " + msg;
		}
		console.log(msg);
	};
	dcl = require("../dcl");
	aop = require("../aop");
}

function submit(msg, success){
	if(success){
		out("Success: " + msg);
	}else{
		out("Failed: " + msg, true);
	}
}

function eqArrays(a, b){
	if(a.length != b.length){
		return false;
	}
	for(var i = 0, l = a.length; i < l; ++i){
		if(a[i] !== b[i]){
			return false;
		}
	}
	return true;
}

function getNames(ctor){
	var b = ctor._meta.bases, r = [];
	for(var i = 0, l = b.length; i < l; ++i){
		r.push(b[i].prototype.declaredClass);
	}
	return r;
}

// tests

var tests = [
	// dcl-mini tests
	function(){
		var A = dcl(null, {});
		submit(A.prototype.declaredClass, A.prototype.declaredClass.match(/uniqName_\d+/));
	},
	function(){
		var A = dcl("A", null, {});
		submit(A.prototype.declaredClass, A.prototype.declaredClass === "A");
	},
	function(){
		var A = dcl("A", null, {});
		var B = dcl("B", A, {});
		var C = dcl("C", B, {});
		submit("[A]", eqArrays(getNames(A), ["A"]));
		submit("[B, A]", eqArrays(getNames(B), ["B", "A"]));
		submit("[C, B, A]", eqArrays(getNames(C), ["C", "B", "A"]));
	},
	function(){
		var A = dcl("A", null, {
			constructor: function(){
				if(!this.a){ this.a = []; }
				this.a.push("A");
			},
			m1: function(){
				this.b = "X";
			},
			m2: dcl.superCall(function(sup){
				return function(){
					if(sup){ sup.call(this); }
					if(!this.c){ this.c = []; }
					this.c.push(1);
				};
			}),
			m3: dcl.superCall(function(sup){
				return function(){
					if(!this.d){ this.d = []; }
					this.d.push("M");
					if(sup){ sup.call(this); }
				};
			})
		});

		var a = new A;
		a.m1();
		a.m2();
		a.m3();
		submit("ctor [A]", eqArrays(a.a, ["A"]));
		submit("m1 X", a.b === "X");
		submit("m2/super [1]", eqArrays(a.c, [1]));
		submit("m3/super [M]", eqArrays(a.d, ["M"]));

		var B = dcl("B", A, {
			constructor: function(){
				if(!this.a){ this.a = []; }
				this.a.push("B");
			},
			m1: function(){
				this.b = "Y";
			},
			m2: dcl.superCall(function(sup){
				return function(){
					if(sup){ sup.call(this); }
					if(!this.c){ this.c = []; }
					this.c.push(2);
				};
			}),
			m3: dcl.superCall(function(sup){
				return function(){
					if(!this.d){ this.d = []; }
					this.d.push("N");
					if(sup){ sup.call(this); }
				};
			})
		});

		var b = new B;
		b.m1();
		b.m2();
		b.m3();
		submit("ctor [A, B]", eqArrays(b.a, ["A", "B"]));
		submit("m1 Y", b.b === "Y");
		submit("m2/super [1, 2]", eqArrays(b.c, [1, 2]));
		submit("m3/super [N, M]", eqArrays(b.d, ["N", "M"]));

		var C = dcl("C", B, {
			constructor: function(){
				if(!this.a){ this.a = []; }
				this.a.push("C");
			},
			m1: function(){
				this.b = "Z";
			},
			m2: dcl.superCall(function(sup){
				return function(){
					if(sup){ sup.call(this); }
					if(!this.c){ this.c = []; }
					this.c.push(3);
				};
			}),
			m3: dcl.superCall(function(sup){
				return function(){
					if(!this.d){ this.d = []; }
					this.d.push("O");
					if(sup){ sup.call(this); }
				};
			})
		});

		var c = new C;
		c.m1();
		c.m2();
		c.m3();
		submit("ctor [A, B, C]", eqArrays(c.a, ["A", "B", "C"]));
		submit("m1 Z", c.b === "Z");
		submit("m2/super [1, 2, 3]", eqArrays(c.c, [1, 2, 3]));
		submit("m3/super [O, N, M]", eqArrays(c.d, ["O", "N", "M"]));
	},
	function(){
		var A = dcl("A", null, {});
		var B = dcl("B", null, {});
		var C = dcl("C", null, {});
		var D = dcl("D", null, {});

		var ABC = dcl("ABC", [A, B, C], {});
		var ADC = dcl("ADC", [A, D, C], {});

		submit("ABC", eqArrays(getNames(ABC), ["ABC", "C", "B", "A"]));
		submit("ADC", eqArrays(getNames(ADC), ["ADC", "C", "D", "A"]));

		var ABCD1 = dcl("ABCD1", [ABC, ADC], {});
		var ABCD2 = dcl("ABCD2", [ADC, ABC], {});

		submit("ABDC diamond", eqArrays(getNames(ABCD1), ["ABCD1", "ADC", "ABC", "C", "D", "B", "A"]));
		submit("ADBC diamond", eqArrays(getNames(ABCD2), ["ABCD2", "ABC", "ADC", "C", "B", "D", "A"]));
	},
	function(){
		var A = dcl("A", null, {});
		var B = dcl("B", null, {});
		var C = dcl("C", null, {});

		var ABC = dcl("ABC", [A, B, C], {});
		var AC = dcl("AC", [A, C], {});
		var BC = dcl("BC", [B, C], {});

		submit("ABC", eqArrays(getNames(ABC), ["ABC", "C", "B", "A"]));
		submit("AC", eqArrays(getNames(AC), ["AC", "C", "A"]));
		submit("BC", eqArrays(getNames(BC), ["BC", "C", "B"]));

		var ABC1 = dcl("ABC1", [ABC, AC], {});
		var ABC2 = dcl("ABC2", [AC, ABC], {});

		submit("ABC1 triangle", eqArrays(getNames(ABC1), ["ABC1", "AC", "ABC", "C", "B", "A"]));
		submit("ABC2 triangle", eqArrays(getNames(ABC2), ["ABC2", "ABC", "AC", "C", "B", "A"]));

		var ABC3 = dcl("ABC3", [ABC, BC], {});
		var ABC4 = dcl("ABC4", [BC, ABC], {});

		submit("ABC3 triangle", eqArrays(getNames(ABC3), ["ABC3", "BC", "ABC", "C", "B", "A"]));
		submit("ABC4 triangle", eqArrays(getNames(ABC4), ["ABC4", "ABC", "BC", "C", "B", "A"]));
	},
	// dcl tests
	function(){
		if(dcl.chainBefore && dcl.chainAfter){
			var A = dcl(null, {});
			dcl.chainBefore(A, "m1");
			dcl.chainAfter(A, "m2");

			var B = dcl(null, {
				m1: function(){
					if(!this.b){ this.b = []; }
					this.b.push("B");
				},
				m2: function(){
					if(!this.c){ this.c = []; }
					this.c.push("B");
				}
			});

			var C = dcl(null, {
				m1: function(){
					if(!this.b){ this.b = []; }
					this.b.push("C");
				},
				m2: function(){
					if(!this.c){ this.c = []; }
					this.c.push("C");
				}
			});

			var D = dcl(null, {
				m1: function(){
					if(!this.b){ this.b = []; }
					this.b.push("D");
				},
				m2: function(){
					if(!this.c){ this.c = []; }
					this.c.push("D");
				}
			});

			var ABCD = dcl([A, B, C, D], {});
			var x = new ABCD;
			x.m1();
			x.m2();

			submit("Chained before", eqArrays(x.b, ["D", "C", "B"]));
			submit("Chained after", eqArrays(x.c, ["B", "C", "D"]));
		}
	},
	function(){
		if(dcl.isInstanceOf){
			var A = dcl(null, {});
			var B = dcl(null, {});
			var C = dcl(null, {});
			var D = dcl(null, {});

			var AC = dcl([A, C], {});
			var BD = dcl([B, D], {});

			var x = new AC, y = new BD;

			submit("x is A", dcl.isInstanceOf(x, A));
			submit("x is not B", !dcl.isInstanceOf(x, B));
			submit("x is C", dcl.isInstanceOf(x, C));
			submit("x is not D", !dcl.isInstanceOf(x, D));

			submit("y is not A", !dcl.isInstanceOf(y, A));
			submit("y is B", dcl.isInstanceOf(y, B));
			submit("y is not C", !dcl.isInstanceOf(y, C));
			submit("y is D", dcl.isInstanceOf(y, D));
		}
	},
	function(){
		if(dcl.advise){
			var A = dcl(null, {
				constructor: dcl.advise({
					around: function(sup){
						return function(){
							if(!this.a){ this.a = []; }
							this.a.push("A");
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
					if(!this.a){ this.a = []; }
					this.a.push("B");
				},
				postscript: function(){
					this.b = "B";
				}
			});

			var C = dcl(null, {
				constructor: function(){
					if(!this.a){ this.a = []; }
					this.a.push("C");
				},
				postscript: function(){
					this.b = "C";
				}
			});

			var x = new (dcl(A, {}));
			submit("x ctor", eqArrays(x.a, ["A"]));
			submit("x post", x.b === "A");

			var y = new (dcl([A, B], {}));
			submit("y ctor", eqArrays(y.a, ["A", "B"]));
			submit("y post", y.b === "B");

			var z = new (dcl([A, B, C], {}));
			submit("z ctor", eqArrays(z.a, ["A", "B", "C"]));
			submit("z post", z.b === "C");
		}
	},
	function(){
		if(dcl.advise){
			var A = dcl(null, {
				m1: dcl.advise({
					after: function(){
						if(!this.a){ this.a = []; }
						this.a.push("Aa");
					}
				})
			});
			var B = dcl(null, {
				m1: dcl.advise({
					before: function(){
						if(!this.a){ this.a = []; }
						this.a.push("Bb");
					}
				})
			});
			var C = dcl(null, {
				m1: dcl.superCall(function(sup){
					return function(){
						if(!this.a){ this.a = []; }
						this.a.push("Cfb");
						if(sup){
							sup.apply(this, arguments);
						}
						this.a.push("Cfa");
					};
				})
			});
			var D = dcl(null, {
				m1: dcl.advise({
					before: function(){
						if(!this.a){ this.a = []; }
						this.a.push("Db");
					},
					around: function(sup){
						return function(){
							if(!this.a){ this.a = []; }
							this.a.push("Dfb");
							if(sup){
								sup.apply(this, arguments);
							}
							this.a.push("Dfa");
						};
					},
					after: function(){
						if(!this.a){ this.a = []; }
						this.a.push("Da");
					}
				})
			});
			var E = dcl(null, {
				m1: function(){
					if(!this.a){ this.a = []; }
					this.a.push("E");
				}
			});

			var x = new (dcl([E, A, B, C, D], {}));
			x.m1();
			submit("EABCD", eqArrays(x.a, ["Db", "Bb", "Dfb", "Cfb", "E", "Cfa", "Dfa", "Aa", "Da"]));

			var y = new (dcl([A, B, C, D, E], {}));
			y.m1();
			submit("ABCDE", eqArrays(y.a, ["Db", "Bb", "E", "Aa", "Da"]));
		}
	}
	// aop tests
];

function runTests(){
	out("Starting tests...");
	for(var i = 0, l = tests.length; i < l; ++i){
		tests[i]();
	}
	out("Finished.");
}

if(typeof require != "undefined" && require.main === module){
	runTests();
}