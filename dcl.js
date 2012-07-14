(function(factory){
	if(typeof define != "undefined"){
		define(["./mini"], factory);
	}else if(typeof module != "undefined"){
		module.exports = factory(require("./mini"));
	}else{
		dcl = factory(dcl);
	}
})(function(dcl){
	"use strict";

	function nop(){}
	function err(msg){ throw Error("ERROR: " + msg); }

	var Advice = dcl(dcl.Super, {
		//declaredClass: "dcl.Advice",
		constructor: function(){
			this.b = this.f.before;
			this.a = this.f.after;
			this.f = this.f.around;
		}
	});
	function advise(f){ return new Advice(f); }

	function stub(id, bases, name, chains){
		var f = chains[name] = dcl._ec(bases, name, "f"),
			b = dcl._ec(bases, name, "b").reverse(),
			a = dcl._ec(bases, name, "a");
		f = id < 3 ? dcl._st(f, id < 2 ? function(f){ return dcl._sc(f.reverse()); } : dcl._sc) : dcl._ss(f, name);
		return !b.length && !a.length ? f || new Function : makeAOPStub(dcl._sc(b), dcl._sc(a), f);
	}

	function makeAOPStub(b, a, f){
		var sb = b || nop,
			sa = a || nop,
			sf = f || nop,
			x = function(){
				var r;
				// running the before chain
				sb.apply(this, arguments);
				// running the around chain
				try{
					r = sf.apply(this, arguments);
				}catch(e){
					r = e;
				}
				// running the after chain
				sa.call(this, arguments, r);
				if(r instanceof Error){
					throw r;
				}
			};
		x.advices = {b: b, a: a, f: f};
		return x;
	}

	function chain(id){
		return function(ctor, name){
			var m = ctor._m;
			if(m){
				if(m.b.length > 1){
					err(name + ": can't set chaining now");
				}
				m.w[name] = id;
			}
		};
	}

	dcl.mix(dcl, {
		// public API
		Advice: Advice,
		advise: advise,
		// expose helper methods
		before: function(f){ return new Advice({before: f}); },
		after: function(f){ return new Advice({after: f}); },
		around: dcl.superCall,
		// chains
		chainBefore: chain(1),
		chainAfter:  chain(2),
		isInstanceOf: function(o, ctor){
			if(o instanceof ctor){
				return true;
			}
			var t = o.constructor._m, i;
			if(t){
				for(t = t.b, i = t.length - 1; i >= 0; --i){
					if(t[i] === ctor){
						return true;
					}
				}
			}
			return false;
		}
	});

	dcl._set(
		//mixChains
		function(dst, src){
			var n, d, s, t;
			for(n in src){
				if((d = +dst[n]) != (s = +src[n])){ // intentional assignments
					if(!d || s == 3){
						if(!d || s != 3){
							dst[n] = s;
						}
					}else{
						err(n + ": incompatible chaining");
					}
				}
			}
		},
		//buildStubs
		function(meta, proto){
			var weaver = meta.w, bases = meta.b, chains = meta.c;
			for(var name in weaver){
				proto[name] = stub(weaver[name], bases, name, chains);
			}
		});

	return dcl;
});
