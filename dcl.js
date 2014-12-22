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

	var Advice = dcl(dcl.Super, {
		//declaredClass: "dcl.Advice",
		constructor: function(){
			this.b = this.f.before;
			this.a = this.f.after;
			this.f = this.f.around;
		}
	});
	function advise(f){ return dcl._makeSuper(f, Advice); }

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
				return r;
			};
		x.advices = {b: b, a: a, f: f};
		return x;
	}

	function chain(id){
		return function(ctor, name){
			var m = ctor._meta, c;
			if(m){
				c = (+m.weaver[name] || 0);
				if(c && c != id){
					dcl._error("set chaining", name, ctor, id, c);
				}
				m.weaver[name] = id;
			}
		};
	}

	dcl.mix(dcl, {
		// public API
		Advice: Advice,
		advise: advise,
		// expose helper methods
		before: function(f){ return dcl.advise({before: f}); },
		after: function(f){ return dcl.advise({after: f}); },
		around: dcl.superCall,
		// chains
		chainBefore: chain(1),
		chainAfter:  chain(2),
		isInstanceOf: function(o, ctor){
			if(o instanceof ctor){
				return true;
			}
			var t = o.constructor._meta, i;
			if(t){
				for(t = t.bases, i = t.length - 1; i >= 0; --i){
					if(t[i] === ctor){
						return true;
					}
				}
			}
			return false;
		},
		// protected API starts with _ (don't use it!)
		_stub: /*generic stub*/ function(id, bases, name, chains){
			var f = chains[name] = dcl._extractChain(bases, name, "f"),
				b = dcl._extractChain(bases, name, "b").reverse(),
				a = dcl._extractChain(bases, name, "a");
			f = id ? dcl._stubChainSuper(f, id == 1 ? function(f){ return dcl._stubChain(f.reverse()); } : dcl._stubChain, name) : dcl._stubSuper(f, name);
			return !b.length && !a.length ? f || function(){} : makeAOPStub(dcl._stubChain(b), dcl._stubChain(a), f);
		}
	});

	return dcl;
});
