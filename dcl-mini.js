(function(define){
	"use strict";
	define([], function(){
		var counter = 0, uniqPrefix = "uniqName_", cname = "constructor", pname = "prototype", F = new Function, mixChains = mix;

		function dcl(name, superClass, props){
			var bases, proto, base, ctor, mixIdx = 0, m, o, r, b, i, j, l, n;

			if(typeof name != "string"){
				props = superClass;
				superClass = name;
				name = uniqPrefix + counter++;
			}
			props = props || {};

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
			r = superClass && superClass._meta ? delegate(superClass._meta.chains) : {constructor: 2};

			// create prototype: mix in mixins and props
			for(; mixIdx > 0; --mixIdx){
				base = bases[mixIdx];
				m = base._meta;
				if(m){
					mix(name, proto, m.hidden);
					mixChains(name, r, m.chains);
				}else{
					mix(name, proto, base[pname]);
				}
			}
			for(n in props){
				m = props[n];
				if(m instanceof Super){
					r[n] = r[n] || 3;
				}else{
					proto[n] = m;
				}
			}

			// create stubs
			if(bases.length == 1){
				r[cname] = 2;
			}
			o = {bases: bases, hidden: props, chains: r};
			bases[0] = {_meta: o};
			buildStubs(r, bases, proto);
			ctor = proto[cname];

			// put in place all decorations and return a constructor
			ctor._meta  = o;
			ctor[pname] = proto;
			proto.constructor = ctor;
			proto.declaredClass = name;
			bases[0] = ctor;

			return ctor;
		}

		function mix(_, a, b){
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

		function chain(bases, name){
			var i = 0, l = bases.length, r = [], f;
			for(; i < l; ++i){
				f = bases[i];
				if(f._meta){
					f = f._meta.hidden;
					if(f.hasOwnProperty(name)){
						f = f[name];
						if(f instanceof Super){
							f = f.f(null);
						}
						if(f){ r.push(f); }
					}
				}else{
					f = f.prototype[name];
					if(f){ r.push(f); }
				}
			}
			return r;
		}

		function stubAfterChain(chain){
			if(chain.length){
				return function(){
					for(var i = chain.length - 1; i >= 0; --i){
						chain[i].apply(this, arguments);
					}
				};
			}
			return new Function;
		}

		function stubSuper(bases, name){
			var i = bases.length - 1, f, p = null;
			for(; i >= 0; --i){
				f = bases[i];
				if(f._meta){
					f = f._meta.hidden;
					if(f.hasOwnProperty(name)){
						f = f[name];
						p = (f instanceof Super ? f.f && f.f(p) : f) || p;
					}
				}else{
					p = f.prototype[name] || p;
				}
			}
			return p || new Function;
		}

		function buildStubs(chains, bases, proto){
			for(var name in chains){
				proto[name] = chains[name] === 3 ? stubSuper(bases, name) : stubAfterChain(chain(bases, name));
			}
		}

		dcl._Super = Super;
		dcl._chain = chain;
		dcl._stubAfterChain = stubAfterChain;
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
