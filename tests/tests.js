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
		var A = dcl(null, {declaredClass: "A"});
		var B = dcl(A, {declaredClass: "B"});
		var C = dcl(B, {declaredClass: "C"});
		submit("A", getNames(A).join("") === "A");
		submit("BA", getNames(B).join("") === "BA");
		submit("CBA", getNames(C).join("") === "CBA");
	},
	function(){
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
		submit("ctor [A]", a.a === "A");
		submit("m1 X", a.b === "X");
		submit("m2/super [1]", a.c === "1");
		submit("m3/super [M]", a.d === "M");

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
		submit("ctor [A, B]", b.a === "AB");
		submit("m1 Y", b.b === "Y");
		submit("m2/super [1, 2]", b.c === "12");
		submit("m3/super [N, M]", b.d === "NM");

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
		submit("ctor [A, B, C]", c.a === "ABC");
		submit("m1 Z", c.b === "Z");
		submit("m2/super [1, 2, 3]", c.c === "123");
		submit("m3/super [O, N, M]", c.d === "ONM");
	},
	function(){
		var A = dcl(null, {declaredClass: "A"});
		var B = dcl(null, {declaredClass: "B"});
		var C = dcl(null, {declaredClass: "C"});
		var D = dcl(null, {declaredClass: "D"});

		var ABC = dcl([A, B, C], {declaredClass: "ABC"});
		var ADC = dcl([A, D, C], {declaredClass: "ADC"});

		submit("ABC", getNames(ABC).join(",") === "ABC,C,B,A");
		submit("ADC", getNames(ADC).join(",") === "ADC,C,D,A");

		var ABCD1 = dcl([ABC, ADC], {declaredClass: "ABCD1"});
		var ABCD2 = dcl([ADC, ABC], {declaredClass: "ABCD2"});

		submit("ABDC diamond", getNames(ABCD1).join(",") === "ABCD1,ADC,ABC,C,D,B,A");
		submit("ADBC diamond", getNames(ABCD2).join(",") === "ABCD2,ABC,ADC,C,B,D,A");
	},
	function(){
		var A = dcl(null, {declaredClass: "A"});
		var B = dcl(null, {declaredClass: "B"});
		var C = dcl(null, {declaredClass: "C"});

		var ABC = dcl([A, B, C], {declaredClass: "ABC"});
		var AC = dcl([A, C], {declaredClass: "AC"});
		var BC = dcl([B, C], {declaredClass: "BC"});

		submit("ABC", getNames(ABC).join(",") === "ABC,C,B,A");
		submit("AC", getNames(AC).join(",") === "AC,C,A");
		submit("BC", getNames(BC).join(",") === "BC,C,B");

		var ABC1 = dcl([ABC, AC], {declaredClass: "ABC1"});
		var ABC2 = dcl([AC, ABC], {declaredClass: "ABC2"});

		submit("ABC1 triangle", getNames(ABC1).join(",") === "ABC1,AC,ABC,C,B,A");
		submit("ABC2 triangle", getNames(ABC2).join(",") === "ABC2,ABC,AC,C,B,A");

		var ABC3 = dcl([ABC, BC], {declaredClass: "ABC3"});
		var ABC4 = dcl([BC, ABC], {declaredClass: "ABC4"});

		submit("ABC3 triangle", getNames(ABC3).join(",") === "ABC3,BC,ABC,C,B,A");
		submit("ABC4 triangle", getNames(ABC4).join(",") === "ABC4,ABC,BC,C,B,A");
	},
	function(){
		var a = new (dcl(null, {
			toString: dcl.superCall(function(sup){
				return function(){
					return "PRE-" + sup.call(this) + "-POST";
				};
			})
		}));
		submit("super-calling intrinsics", a.toString() === "PRE-[object Object]-POST");
	},
	// dcl tests
	function(){
		if(dcl.chainBefore && dcl.chainAfter){
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

			submit("Chained before", x.b === "DCB");
			submit("Chained after", x.c === "BCD");
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
			submit("x ctor", x.a === "A");
			submit("x post", x.b === "A");

			var y = new (dcl([A, B], {}));
			submit("y ctor", y.a === "AB");
			submit("y post", y.b === "B");

			var z = new (dcl([A, B, C], {}));
			submit("z ctor", z.a === "ABC");
			submit("z post", z.b === "C");
		}
	},
	function(){
		if(dcl.advise){
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
			submit("AP", x.a === "AP");

			var y = new (dcl([A, B], {}));
			submit("ABP", y.a === "ABP");

			var z = new (dcl([A, B, C], {}));
			submit("ABCP", z.a === "ABCP");

			var m = new (dcl([B, A], {}));
			submit("BAP", m.a === "BAP");

			var n = new (dcl([C, A, B], {}));
			submit("CABP", n.a === "CABP");
		}
	},
	function(){
		if(dcl.advise){
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
			submit("EABCD", x.a === "DbBbDfbCfbECfaDfaAaDa");

			var y = new (dcl([A, B, C, D, E], {}));
			y.m1();
			submit("ABCDE", y.a === "DbBbEAaDa");
		}
	},
	function(){
		if(dcl.advise){
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
			submit("AB", x.a === "BbAbAaBa");

			var y = new (dcl([B, A], {}));
			y.m1();
			submit("BA", y.a === "AbBbBaAa");
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