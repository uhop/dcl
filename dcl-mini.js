(function(define){
	"use strict";
	define([], function(){
		var counter = 0, cname = "constructor", pname = "prototype", F = new Function, mixChains = mix, empty = {};

		function dcl(superClass, props){
			var bases, proto, base, ctor, mixIdx = 0, m, o, r, b, i, j, l, n;

			if(superClass){
				if(superClass instanceof Array){
					// mixins: C3 MRO approximation
					m = {}; o = {}; r = []; b = [];
					for(i = superClass.length - 1; i >= 0; --i){
						base = superClass[i];
						// pre-process a base
						// 1) add declaredClass
						if(!base.__u){
							base.__u = counter++;
						}
						// 2) build a connection map and the base list
						proto = base[pname];
						if(base._meta){
							for(bases = base._meta.bases, j = 0, l = bases.length - 1; j < l; ++j){
								n = bases[j].__u;
								m[n] = m[n] || [];
								m[n].push(bases[j + 1]);
							}
							b = b.concat(bases);
						}else{
							b.push(base);
						}
					}
					// build output
					while(b.length){
						base = b.pop();
						n = base.__u;
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
					mixIdx = r.length - (base._meta && base === r[base._meta.bases.length - 1] ? base._meta.bases.length : 1);
					bases = r.reverse();
					superClass = bases[mixIdx--];
				}else{
					// single inheritance
					bases = [0].concat(superClass._meta ? superClass._meta.bases: superClass);
				}
				// create a base class
				proto = delegate(superClass[pname]);
			}else{
				// no super class
				bases = [0];
				proto = {};
			}
			// the next line assumes that constructor is actually named "constructor", should be changed if desired
			r = superClass && superClass._meta ? delegate(superClass._meta.chains) : {constructor: 2};

			// create prototype: mix in mixins and props
			for(; mixIdx > 0; --mixIdx){
				base = bases[mixIdx];
				m = base._meta;
				if(m){
					mix(proto, m.hidden);
					mixChains(r, m.chains);
				}else{
					mix(proto, base[pname]);
				}
			}
			for(n in props){
				m = props[n];
				if(m instanceof Super){
					r[n] = +r[n] || 3;
				}else{
					proto[n] = m;
				}
			}

			// create stubs
			o = {bases: bases, hidden: props, chains: r};
			bases[0] = {_meta: o};
			buildStubs(r, bases, proto);
			ctor = proto[cname];

			// put in place all decorations and return a constructor
			ctor._meta  = o;
			ctor[pname] = proto;
			//proto.constructor = ctor; // uncomment if constructor is not named "constructor"
			bases[0] = ctor;

			return ctor;
		}

		// utilities

		function mix(a, b){
			for(var n in b){
				a[n] = b[n];
			}
		}

		function delegate(o){
		    F[pname] = o;
		    var t = new F;
		    F[pname] = null;
		    return t;
		}

		dcl._setStubs = function(mix, build){
			mixChains = mix;
			buildStubs = build;
		};

		// decorators

		function Super(f){ this.f = f; }
		dcl.superCall = function(f){ return new Super(f); };

		function iterate(bases, name, c, s){
			var i = bases.length - 1, f;
			for(; i >= 0; --i){
				f = bases[i];
				if(f._meta){
					f = f._meta.hidden;
					if(f.hasOwnProperty(name)){
						c(f[name]);
					}
				}else{
					s(f[pname][name]);
				}
			}
		}

		function chain(bases, name, c, s){
			var r = [], t = empty[name];
			iterate(
				bases, name,
				function(f){
					if(f instanceof Super){
						f = f.f(null);
					}
					if(f){ r.push(f); }
				},
				function(f){
					if(f && f !== t){ r.push(f); }
				});
			return r;
		}

		function stubSuper(bases, name){
			var p = empty[name], t = p;
			iterate(
				bases, name,
				function(f){
					p = (f instanceof Super ? f.f && f.f(p) : f) || p;
				},
				function(f){
					p = f && f !== t ? f : p;
				});
			return p;
		}

		function stubChain(chain){
			return chain.length ? function(){
				for(var i = chain.length - 1; i >= 0; --i){
					chain[i].apply(this, arguments);
				}
			} : 0;
		}

		function buildStubs(chains, bases, proto){
			for(var name in chains){
				proto[name] = (chains[name] === 3 ? stubSuper(bases, name) :
					stubChain(chain(bases, name).reverse())) || new Function;
			}
		}

		dcl._Super = Super;
		dcl._iterate = iterate;
		dcl._chain = chain;
		dcl._stubChain = stubChain;
		dcl._stubSuper = stubSuper;

		return dcl;
	});
})(typeof define != "undefined" ? define : function(_, f){
	if(typeof module != "undefined"){
		module.exports = f();
	}else{
		dcl = f();  // describing a global
	}
});
