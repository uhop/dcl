(function(factory){
	if(typeof define != "undefined"){
		define(["./dcl-mini"], factory);
	}else if(typeof module != "undefined"){
		module.exports = factory(require("./dcl-mini"));
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

	//advise.before = function(f){ return new Advice({before: f}); };
	//advise.after  = function(f){ return new Advice({after: f}); };

	function stub(id, bases, name, chains){
		var i = bases.length - 1,
			f = chains[name] = dcl._ch(bases, name, id < 3 ? nop : function(f){ return f; }, "f"),
			b = dcl._ch(bases, name, nop, "b"),
			a = dcl._ch(bases, name, nop, "a");
		f = id < 3 ? dcl._sc(id < 2 ? f : f.reverse()) : dcl._ss(f);
		return !b.length && !a.length ? f || new Function : makeAOPStub(dcl._sc(b), dcl._sc(a.reverse()), f);
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
		chainBefore: chain(1),
		chainAfter:  chain(2),
		isInstanceOf: function(o, ctor){ return o instanceof ctor || o.constructor._m && o.constructor._m.b.indexOf(ctor) > 0; }
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
