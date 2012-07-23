// test harness

if(typeof out == "undefined"){
	out = function(msg){
		console.log(msg);
	};
	_total = 0;
	_errors = 0;
	res = function(msg, isError){
		++_total;
		if(isError){
			++_errors;
			console.log(msg);
		}
	};
	dcl = require("../dcl");
	advise = require("../advise");
	inherited = require("../inherited");
	dcl_debug = require("../debug");
}

function submit(msg, success){
	if(success){
		res("Success: " + msg);
	}else{
		res("Failed: " + msg, true);
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
	var b = ctor._m.b, r = [];
	for(var i = 0, l = b.length; i < l; ++i){
		r.push(b[i].prototype.declaredClass);
	}
	return r;
}

// tests

var tests = [
	// mini.js tests
	function(){
		"use strict";
		var A = dcl(null, {declaredClass: "A"});
		var B = dcl(A, {declaredClass: "B"});
		var C = dcl(B, {declaredClass: "C"});
		submit("A", getNames(A).join("") === "A");
		submit("BA", getNames(B).join("") === "BA");
		submit("CBA", getNames(C).join("") === "CBA");
	},
	function(){
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
		"use strict";

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
		"use strict";

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
		"use strict";
		var a = new (dcl(null, {
			toString: dcl.superCall(function(sup){
				return function(){
					return "PRE-" + sup.call(this) + "-POST";
				};
			})
		}));
		submit("super-calling intrinsics", a.toString() === "PRE-[object Object]-POST");
	},
	function(){
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
			submit("Should fail: AB. BA inheritance", failed === true);
		}
	},
	// dcl tests
	function(){
		"use strict";

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
		"use strict";

		if(dcl.chainBefore && dcl.chainAfter){
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

			submit("Chained with super before", x.b === "EDCbBACa");
			submit("Chained with super after", x.c === "CbABCaDE");

			x.reset();
			x.flag = false;
			x.m1();
			x.m2();

			submit("Chained without calling super before", x.b === "EDCbCa");
			submit("Chained without calling super after", x.c === "CbCaDE");
		}
	},
	function(){
		"use strict";

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
		"use strict";

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
			submit("AP, not BAP", m.a === "AP");

			var n = new (dcl([C, A, B], {}));
			submit("ABP, CABP", n.a === "ABP");
		}
	},
	function(){
		"use strict";

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
		"use strict";

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
	},
	// advise tests
	function(){
		"use strict";

		if(dcl.advise && typeof advise != "undefined"){
			var A = dcl(null, {
				m1: dcl.advise({
					before: function(){
						if(!this.a){ this.a = ""; }
						this.a += "b";
					},
					after: function(){
						if(!this.a){ this.a = ""; }
						this.a += "a";
					}
				})
			});
			var B = dcl(A, {
				m1: function(x){
					if(!this.a){ this.a = ""; }
					this.a += x;
				}
			});

			var x = new B;
			x.m1("-");
			submit("b-a", x.a === "b-a");

			var h1 = advise(x, "m1", {
				after: function(){
					if(!this.a){ this.a = ""; }
					this.a += "A1";
				}
			});
			x.a = "";
			x.m1("-");
			submit("b-aA1", x.a === "b-aA1");

			var h2 = advise(x, "m1", {
				before: function(){
					if(!this.a){ this.a = ""; }
					this.a += "B1";
				}
			});
			x.a = "";
			x.m1("-");
			submit("B1b-aA1", x.a === "B1b-aA1");

			var h3 = advise(x, "m1", {
				around: function(sup){
					return function(){
						if(!this.a){ this.a = ""; }
						this.a += "F1";
						if(sup){ sup.apply(this, arguments); }
						this.a += "F2";
					};
				}
			});
			x.a = "";
			x.m1("-");
			submit("B1bF1-F2aA1", x.a === "B1bF1-F2aA1");

			h1.unadvise();
			x.a = "";
			x.m1("-");
			submit("B1bF1-F2a", x.a === "B1bF1-F2a");

			h2.unadvise();
			x.a = "";
			x.m1("-");
			submit("bF1-F2a", x.a === "bF1-F2a");

			h3.unadvise();
			x.a = "";
			x.m1("-");
			submit("b-a #2", x.a === "b-a");
		}
	},
	function(){
		"use strict";

		if(typeof advise != "undefined"){
			var x = new (dcl(null, {
				constructor: function(){
					this.a = "";
				},
				m1: function(){
					this.a += "*";
				}
			}));

			x.m1();
			submit("no advises", x.a === "*");

			var h1 = advise(x, "m1", {
				around: function(sup){
					return function(){
						this.a += "b1";
						sup.call(this);
						this.a += "a1";
					};
				}
			});

			x.a = "";
			x.m1();
			submit("Advise #1", x.a === "b1*a1");

			var h2 = advise(x, "m1", {
				around: function(sup){
					return function(){
						this.a += "b2";
						sup.call(this);
						this.a += "a2";
					};
				}
			});

			x.a = "";
			x.m1();
			submit("Advises ##1-2", x.a === "b2b1*a1a2");

			var h3 = advise(x, "m1", {
				around: function(sup){
					return function(){
						this.a += "b3";
						sup.call(this);
						this.a += "a3";
					};
				}
			});

			x.a = "";
			x.m1();
			submit("Advises ##1-3", x.a === "b3b2b1*a1a2a3");

			var h4 = advise(x, "m1", {
				around: function(sup){
					return function(){
						this.a += "b4";
						sup.call(this);
						this.a += "a4";
					};
				}
			});

			x.a = "";
			x.m1();
			submit("Advises ##1-4", x.a === "b4b3b2b1*a1a2a3a4");

			h2.unadvise();
			x.a = "";
			x.m1();
			submit("Advises ##1,3,4", x.a === "b4b3b1*a1a3a4");

			h1.unadvise();
			x.a = "";
			x.m1();
			submit("Advises ##3,4", x.a === "b4b3*a3a4");

			h3.unadvise();
			x.a = "";
			x.m1();
			submit("Advise #4", x.a === "b4*a4");

			h4.unadvise();
			x.a = "";
			x.m1();
			submit("no advices again", x.a === "*");
		}
	},
	// inherited tests
	function(){
		if(dcl.inherited){
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
			submit("inherited m2/super 12", b.c === "12");
			submit("inherited m3/super NM", b.d === "NM");

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
			submit("inherited m2/super 123", c.c === "123");
			submit("inherited m3/super ONM", c.d === "ONM");
		}
	},
	function(){
		if(dcl.inherited){
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
			submit("m2/inherited 1", a.c === "1");
			submit("m3/inherited M", a.d === "M");

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
			submit("m2/inherited 12", b.c === "12");
			submit("m3/inherited NM", b.d === "NM");

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
			submit("m2/inherited 123", c.c === "123");
			submit("m3/inherited ONM", c.d === "ONM");
		}
	},
	function(){
		if(dcl.inherited){
			var a = new (dcl(null, {
				toString: function(){
					return "PRE-" + this.inherited(arguments) + "-POST";
				}
			}));
			submit("inherited-calling intrinsics", a.toString() === "PRE-[object Object]-POST");
		}
	},
	function(){
		"use strict";
		if(dcl.inherited){
			var A = dcl(null, {
				toString: function(){
					return "PRE-" + this.inherited(A, "toString", arguments) + "-POST";
				}
			});
			var a = new A;
			submit("strict inherited-calling intrinsics", a.toString() === "PRE-[object Object]-POST");
		}
	}
];

function runTests(){
	_total = _errors = 0;
	var exceptionFlag = false;
	out("Starting tests...");
	for(var i = 0, l = tests.length; i < l; ++i){
		try{
			tests[i]();
		}catch(e){
			if(isError){
				exceptionFlag = true;
				console.log("Unhandled exception in test #" + i + ": " + e.message);
			}
		}
	}
	out(_errors ? "Failed " + _errors + " out of " + _total + " tests." : "Finished " + _total + " tests.");
	if(typeof process != "undefined"){
		process.exit(_errors || exceptionFlag? 1 : 0);
	}
}

if(typeof require != "undefined" && require.main === module){
	runTests();
}
