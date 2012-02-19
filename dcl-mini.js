(function(define){
	"use strict";
	define([], function(){
		var counter = 0, cname = "constructor", pname = "prototype", F = new Function, empty = {},
			mixIn, delegate, mixInChains, Super, iterate, chain, stubSuper, stubChain;

		function dcl(superClass, props){
			var bases, proto, base, ctor, mixIdx = 0, m, o, r, b, i, j, l, n;

			if(superClass){
				if(superClass instanceof Array){
					// mixins: C3 MRO approximation
					m = {}; o = {}; r = []; b = [];
					for(i = superClass.length - 1; i >= 0; --i){
						base = superClass[i];
						// pre-process a base
						// 1) add a unique id
						base._u = base._u || counter++;
						// 2) build a connection map and the base list
						if((proto = base._m)){   // intentional assignment
							for(bases = proto.b, j = 0, l = bases.length - 1; j < l; ++j){
								n = bases[j]._u;
								n = m[n] = m[n] || [];
								n.push(bases[j + 1]);
							}
							b = b.concat(bases);
						}else{
							b.push(base);
						}
					}
					// build output
					while(b.length){
						base = b.pop();
						n = base._u;
						if(!o[n]){
							if(m[n]){
								b = b.concat(base, m[n]);
								m[n] = 0;
							}else{
								o[n] = 1;
								r.push(base);
							}
						}
					}
					r.push(0); // reserve space for this class
					// calculate a base class
					base = superClass[0];
					mixIdx = r.length - ((m = base._m) && base === r[(l = m.b.length) - 1] ? l : 1); // intentional assignments
					bases = r.reverse();
					superClass = bases[mixIdx--];
				}else{
					// single inheritance
					bases = [0].concat((m = superClass._m) ? m.b: superClass);   // intentional assignment
				}
				// create a base class
				proto = delegate(superClass[pname]);
			}else{
				// no super class
				bases = [0];
				proto = {};
			}
			// the next line assumes that constructor is actually named "constructor", should be changed if desired
			r = superClass && (m = superClass._m) ? delegate(m.w) : {constructor: 2};   // intentional assignment

			// create prototype: mix in mixins and props
			for(; mixIdx > 0; --mixIdx){
				base = bases[mixIdx];
				m = base._m;
				if(m){
					mixIn(proto, m.h);
					mixInChains(r, m.w);
				}else{
					mixIn(proto, base[pname]);
				}
			}
			for(n in props){
				if(isSuper(m = props[n])){  // intentional assignment
					r[n] = +r[n] || 3;
				}else{
					proto[n] = m;
				}
			}

			// create stubs
			o = {b: bases, h: props, w: r, c: {}};
			bases[0] = {_m: o};
			buildStubs(o, proto);
			ctor = proto[cname];

			// put in place all decorations and return a constructor
			ctor._m  = o;
			ctor[pname] = proto;
			//proto.constructor = ctor; // uncomment if constructor is not named "constructor"
			bases[0] = ctor;

			return ctor;
		}

		// utilities

		mixInChains = mixIn = dcl.mix = function(a, b){
			for(var n in b){
				a[n] = b[n];
			}
		};

		delegate = dcl.delegate = function(o){
		    F[pname] = o;
		    var t = new F;
		    F[pname] = null;
		    return t;
		};

		dcl._set = function(m, bs){
			mixInChains = m || mixInChains;
			buildStubs = bs || buildStubs;
			return [mixInChains, buildStubs];
		};

		// decorators

		Super = dcl.Super = function(f){ this.f = f; };
		dcl.superCall = function(f){ return new Super(f); };
		function isSuper(f){ return f instanceof Super; }

		chain = dcl._ch = function(bases, name, next, advice){
			var i = bases.length - 1, t = empty[name], base, meta, r = [], f, p, flag = advice == "f";
			if(t && name != cname && flag){ r.push(t); p = next(t); }
			for(; i >= 0; --i, f = 0){
				base = bases[i];
				if((meta = base._m)){  // intentional assignment
					if((meta = meta.h).hasOwnProperty(name)){ // intentional assignment
						f = isSuper(f = meta[name]) ? (flag ? f.f && (f = f.f(p), f.ctr = base, f.nom = name, f) : f[advice]) : (flag && f);    // intentional assignments
					}
				}else{
					f = flag && ((name == cname ? base : (f = base[pname][name], f !== t && f)) || p);
				}
				if(f){ r.push(f); p = next(f || p); }
			}
			return r;
		};

		stubChain = dcl._sc = function(chain){
			return chain.length ? function(){
				for(var i = chain.length - 1; i >= 0; --i){
					chain[i].apply(this, arguments);
				}
			} : 0;
		};

		stubSuper = dcl._ss = function(chain){
			var l = chain.length;
			return l && chain[l - 1];
		};

		function nop(){}
		function unit(f){ return f; }

		function buildStubs(meta, proto){
			var weaver = meta.w, bases = meta.b, chains = meta.c, name, ch;
			for(name in weaver){
				proto[name] = (weaver[name] === 3 ?
					stubSuper(ch = chain(bases, name, unit, "f")) :
					stubChain(ch = chain(bases, name, nop, "f").reverse())) || new Function;
				chains[name] = ch;
			}
		}

		return dcl;
	});
})(typeof define != "undefined" ? define : function(_, f){
	if(typeof module != "undefined"){
		module.exports = f();
	}else{
		dcl = f();  // describing a global
	}
});
