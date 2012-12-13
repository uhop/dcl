(function(factory){
	if(typeof define != "undefined"){
		define(["./mini", "./advise"], factory);
	}else if(typeof module != "undefined"){
		module.exports = factory(require("./mini"), require("./advise"));
	}else{
		dclDebug = factory(dcl, advise);
	}
})(function(dcl, advise){
	function DclError(message){
		if(Error.captureStackTrace){
			Error.captureStackTrace(this, DclError);
		}
		var e = Error.call(this, message), name;
		for(name in e){
			if(e.hasOwnProperty(name)){
				this[name] = e[name];
			}
		}
		this.message = message;
	}
	DclError.prototype = dcl.delegate(Error.prototype);
	DclError.prototype.constructor = DclError;

	var CycleError = dcl(DclError, {declaredClass: "dcl/debug/CycleError"}),
		ChainingError = dcl(DclError, {declaredClass: "dcl/debug/ChainingError"}),
		SetChainingError = dcl(DclError, {declaredClass: "dcl/debug/SetChainingError"}),
		SuperCallError = dcl(DclError, {declaredClass: "dcl/debug/SuperCallError"}),
		SuperError = dcl(DclError, {declaredClass: "dcl/debug/SuperError"}),
		SuperResultError = dcl(DclError, {declaredClass: "dcl/debug/SuperResultError"});

	var chainNames = ["UNCHAINED BUT CONTAINS ADVICE(S)", "CHAINED BEFORE", "CHAINED AFTER",
			"ERRONEOUSLY CHAINED BEFORE AND AFTER"];
	function chainName(id){
		return id >= 0 && id <= 3 ? chainNames[id] : "UNKNOWN (" + id + ")";
	}

	var noDecls = "(specify 'declaredClass' string in your classes to get better diagnostics)";
	advise.around(dcl, "_e", function(/*sup*/){
		return function(reason, a1, a2, a3, a4, a5){
			var cName, someUnknown, i, base, name, names = [], c = {};
			switch(reason){
				case "cycle":
					cName = a1.hasOwnProperty("declaredClass") && a1.declaredClass;
					someUnknown = !cName;
					for(i = a2.length - 1; i >= 0; --i){
						base = a2[i][0];
						name = base.prototype.hasOwnProperty("declaredClass") && base.prototype.declaredClass;
						if(!name){
							name = "UNNAMED_" + base._u;
							someUnknown = true;
						}
						if(!c[name]){
							names.push(name);
							c[name] = 1;
						}
					}
					throw new CycleError("dcl: base class cycle found in: " + (cName || "UNNAMED") +
						" - bases: " + names.join(", ") + " are mutually dependent" +
						(someUnknown ? noDecls : ""));
				case "chain":
					cName = a2.prototype.hasOwnProperty("declaredClass") && a2.prototype.declaredClass;
					name = a4.prototype.hasOwnProperty("declaredClass") && a4.prototype.declaredClass;
					someUnknown = !(cName && name);
					throw new ChainingError("dcl: conflicting chain directives from bases found in: " + (cName || ("UNNAMED_" + a2._u)) +
						", method: " + a1 + " - it was " + chainName(a3) + " yet " +
						(name || ("UNNAMED_" + a4._u)) + " sets it to " + chainName(a5) +
						(someUnknown ? noDecls : ""));
				case "set chaining":
					cName = a2.prototype.hasOwnProperty("declaredClass") && a2.prototype.declaredClass;
					someUnknown = !cName;
					throw new SetChainingError("dcl: attempt to set conflicting chain directives in: " + (cName || ("UNNAMED_" + a2._u)) +
						", method: " + a1 + " - it was " + chainName(a4) + " yet being changed to " + chainName(a3) +
						(someUnknown ? noDecls : ""));
				case "wrong super call":
					cName = a1.prototype.hasOwnProperty("declaredClass") && a1.prototype.declaredClass;
					someUnknown = !cName;
					throw new SuperCallError("dcl: argument of around advice or supercall decorator should be a function in: " +
						(cName || ("UNNAMED_" + a1._u)) + ", method: " + a2 + (someUnknown ? noDecls : ""));
				case "wrong super":
					cName = a1.prototype.hasOwnProperty("declaredClass") && a1.prototype.declaredClass;
					someUnknown = !cName;
					throw new SuperError("dcl: super method should be a function in: " +
						(cName || ("UNNAMED_" + a1._u)) + ", method: " + a2 + (someUnknown ? noDecls : ""));
				case "wrong super result":
					cName = a1.prototype.hasOwnProperty("declaredClass") && a1.prototype.declaredClass;
					someUnknown = !cName;
					throw new SuperResultError("dcl: around advice or supercall should return a function in: " +
						(cName || ("UNNAMED_" + a1._u)) + ", method: " + a2 + (someUnknown ? noDecls : ""));
			}
			throw new DclError("dcl: " + reason);
		};
	});

	advise.after(dcl, "_p", function(args, ctor){
		// validate that chaining is consistent
		var meta = ctor._m, weaver = meta.w, bases = meta.b,
			name, chain, base, i, c;
		for(name in weaver){
			chain = (+weaver[name] || 0);
			for(i = bases.length - 1; i >= 0; --i){
				base = bases[i];
				meta = base._m;
				if(meta){
					c = (+meta.w[name] || 0);
					if(chain != c && (!chain || c)){
						dcl._e("chain", name, ctor, chain, base, c);
					}
				}
			}
		}
	});

	advise.around(dcl, "_f", function(/*sup*/){
		return function(f, a, n){
			if(typeof f.f != "function"){
				dcl._e("wrong super call", f.ctr, n);
			}
			if(a && typeof a != "function"){
				dcl._e("wrong super", f.ctr, n);
			}
			var t = f.f(a);
			if(typeof t != "function"){
				dcl._e("wrong super result", f.ctr, n);
			}
			t.ctr = f.ctr;
			return t;
		};
	});

	advise(advise, "_f", {
		before: function(f, a, n){
			if(typeof f != "function"){
				dcl._e("wrong super call", n.i.constructor, n.n);
			}
			if(a && typeof a != "function"){
				dcl._e("wrong super", n.i.constructor, n.n);
			}
		},
		after: function(a, f){
			if(typeof f != "function"){
				dcl._e("wrong super result", a[2].i.constructor, a[2].n);
			}
		}
	});

	function logCtor(ctor){
		var meta = ctor._m;
		if(!meta){
			console.log("*** class does not have meta information compatible with dcl");
			return;
		}
		var weaver = meta.w, bases = meta.b, chains = meta.c, names = [], base, name, someUnknown, i;
		for(i = 0; i < bases.length; ++i){
			base = bases[i];
			name = base.prototype.hasOwnProperty("declaredClass") && base.prototype.declaredClass;
			if(!name){
				name = "UNNAMED_" + (base.hasOwnProperty("_u") ? base._u : "");
				someUnknown = true;
			}
			names.push(name);
		}
		console.log("*** class " + names[0] + " depends on " + (names.length - 1) + " classes");
		if(names.length > 1){
			console.log("    dependencies: " + names.slice(1).join(", "));
		}
		if(someUnknown){
			console.log("    " + noDecls);
		}
		for(name in weaver){
			i = +weaver[name];
			if(!isNaN(i)){
				var hasStub = typeof ctor.prototype[name].advices == "object";
				if(hasStub){
					var b = dcl._ec(bases, name, "b").length,
						f = dcl._ec(bases, name, "f").length,
						a = dcl._ec(bases, name, "a").length;
				}
				console.log("    class method " + name + " is " + chainName(i) + 
					(hasStub ?
						", and has an AOP stub (before: " + b + ", around: " + f + ", after: " + a + ")" :
						" (length: " + chains[name].length + ")" ));
			}
		}
	}

	function countAdvices(node, chain){
		for(var c = 0, p = node[chain]; p != node; p = p[chain], ++c);
		return c;
	}

	function log(o, suppressCtor){
		switch(typeof o){
			case "function":
				logCtor(o);
				return;
			case "object":
				var base = o.constructor,
					name = base.prototype.hasOwnProperty("declaredClass") && base.prototype.declaredClass;
				if(!name){
					name = "UNNAMED_" + (base.hasOwnProperty("_u") ? base._u : "");
				}
				console.log("*** object of class " + name);
				// log the constructor
				if(!suppressCtor){
					logCtor(base);
				}
				// log methods
				for(name in o){
					var f = o[name], b, r, a;
					if(typeof f == "function"){
						if(f.adviceNode && f.adviceNode instanceof advise.Node){
							b = countAdvices(f.adviceNode, "pb");
							r = countAdvices(f.adviceNode, "pf");
							a = countAdvices(f.adviceNode, "pa");
							console.log("    object method " + name + " has an AOP stub (before: " +
								b + ", around: " + r + ", after: " + a + ")");
						}
					}
				}
				return;
		}
		console.log(o);
	}

	return {
		log: log,
		DclError: DclError,
		CycleError: CycleError,
		ChainingError: ChainingError,
		SetChainingError: SetChainingError,
		SuperCallError: SuperCallError,
		SuperError: SuperError,
		SuperResultError: SuperResultError
	};
});
