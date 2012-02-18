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
						if((proto = base._meta)){   // intentional assignment
							for(bases = proto.bases, j = 0, l = bases.length - 1; j < l; ++j){
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
					mixIdx = r.length - ((m = base._meta) && base === r[(l = m.bases.length) - 1] ? l : 1); // intentional assignments
					bases = r.reverse();
					superClass = bases[mixIdx--];
				}else{
					// single inheritance
					bases = [0].concat((m = superClass._meta) ? m.bases: superClass);   // intentional assignment
				}
				// create a base class
				proto = delegate(superClass[pname]);
			}else{
				// no super class
				bases = [0];
				proto = {};
			}
			// the next line assumes that constructor is actually named "constructor", should be changed if desired
			r = superClass && (m = superClass._meta) ? delegate(m.chains) : {constructor: 2};   // intentional assignment

			// create prototype: mix in mixins and props
			for(; mixIdx > 0; --mixIdx){
				base = bases[mixIdx];
				m = base._meta;
				if(m){
					mixIn(proto, m.hidden);
					mixInChains(r, m.chains);
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
			o = {bases: bases, hidden: props, chains: r};
			bases[0] = {_meta: o};
			buildStubs(o, proto);
			ctor = proto[cname];

			// put in place all decorations and return a constructor
			ctor._meta  = o;
			ctor[pname] = proto;
			//proto.constructor = ctor; // uncomment if constructor is not named "constructor"
			bases[0] = ctor;

			return ctor;
		}

		// utilities

		mixIn = dcl.mix = function(a, b){
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

		Super = dcl.Super = function(f){ this.f = f; }
		dcl.superCall = function(f){ return new Super(f); };
		function isSuper(f){ return f instanceof Super; }

		iterate = dcl._it = function(bases, name, c, s){
			var i = bases.length - 1, f, m;
			for(; i >= 0; --i){
				f = bases[i];
				if((m = f._meta)){  // intentional assignment
					f = m.hidden;
					if(f.hasOwnProperty(name)){
						c(f[name]);
					}
				}else{
					s(name == cname ? f : f[pname][name]);
				}
			}
		};

		chain = dcl._ch = function(bases, name){
			var t = empty[name], r = [];
			iterate(
				bases, name,
				function(f){
					if(isSuper(f)){
						f = f.f(null);
					}
					if(f){ r.push(f); }
				},
				function(f){
					if(f && f !== t){ r.push(f); }
				});
			return r;
		};

		stubSuper = dcl._ss = function(bases, name){
			var t = empty[name], p = t;
			iterate(
				bases, name,
				function(f){
					p = (isSuper(f) ? f.f && f.f(p) : f) || p;
				},
				function(f){
					p = f !== t && f || p;
				});
			return p;
		};

		stubChain = dcl._sc = function(chain){
			return chain.length ? function(){
				for(var i = chain.length - 1; i >= 0; --i){
					chain[i].apply(this, arguments);
				}
			} : 0;
		};

		function buildStubs(meta, proto){
			var chains = meta.chains, bases = meta.bases;
			for(var name in chains){
				proto[name] = (chains[name] === 3 ? stubSuper(bases, name) :
					stubChain(chain(bases, name).reverse())) || new Function;
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
