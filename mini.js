(function(factory){
	if(typeof define != "undefined"){
		define([], factory);
	}else if(typeof module != "undefined"){
		module.exports = factory();
	}else{
		dcl = factory();
	}
})(function(){
	"use strict";

	var counter = 0, cname = "constructor", pname = "prototype",
		F = function(){}, empty = {}, mix, extractChain,
		stubSuper, stubChain, stubChainSuper, post;

	function dcl(superClass, props){
		var bases = [0], proto, base, ctor, m, o, r, b, i, j = 0, n;

		if(superClass){
			if(superClass instanceof Array){
				// mixins: C3 MRO
				m = {}; b = superClass.slice(0).reverse();
				for(i = b.length - 1; i >= 0; --i){
					base = b[i];
					// pre-process a base
					// 1) add a unique id
					base._u = base._u || counter++;
					// 2) build a connection map and the base list
					if((proto = base._m)){   // intentional assignment
						for(r = proto.b, j = r.length - 1; j > 0; --j){
							n = r[j]._u;
							m[n] = (m[n] || 0) + 1;
						}
						b[i] = r.slice(0);
					}else{
						b[i] = [base];
					}
				}
				// build output
				o = {};
				c: while(b.length){
					for(i = 0; i < b.length; ++i){
						r = b[i];
						base = r[0];
						n = base._u;
						if(!m[n]){
							if(!o[n]){
								bases.push(base);
								o[n] = 1;
							}
							r.shift();
							if(r.length){
								--m[r[0]._u];
							}else{
								b.splice(i, 1);
							}
							continue c;
						}
					}
					// error
					dcl._e("cycle", props, b);
				}
				// calculate a base class
				superClass = superClass[0];
				j = bases.length - ((m = superClass._m) && superClass === bases[bases.length - (j = m.b.length)] ? j : 1) - 1; // intentional assignments
			}else{
				// 1) add a unique id
				superClass._u = superClass._u || counter++;
				// 2) single inheritance
				bases = bases.concat((m = superClass._m) ? m.b : superClass);   // intentional assignment
			}
		}
		// create a base class
		proto = superClass ? dcl.delegate(superClass[pname]) : {};
		// the next line assumes that constructor is actually named "constructor", should be changed if desired
		r = superClass && (m = superClass._m) ? dcl.delegate(m.w) : {constructor: 2};   // intentional assignment

		// create prototype: mix in mixins and props
		for(; j > 0; --j){
			base = bases[j];
			m = base._m;
			mix(proto, m && m.h || base[pname]);
			if(m){
				for(n in (b = m.w)){    // intentional assignment
					r[n] = (+r[n] || 0) | b[n];
				}
			}
		}
		for(n in props){
			if(isSuper(m = props[n])){  // intentional assignment
				r[n] = +r[n] || 0;
			}else{
				proto[n] = m;
			}
		}

		// create stubs with fake constructor
		o = {b: bases, h: props, w: r, c: {}};
		bases[0] = {_m: o, prototype: proto};
		buildStubs(o, proto);
		ctor = proto[cname];

		// put in place all decorations and return a constructor
		ctor._m  = o;
		ctor[pname] = proto;
		//proto.constructor = ctor; // uncomment if constructor is not named "constructor"
		bases[0] = ctor;

		return dcl._p(ctor);    // fully prepared constructor
	}

	// decorators

	function Super(f){ this.f = f; }
	function isSuper(f){ return f instanceof Super; }

	// utilities

	(mix = function(a, b){
		for(var n in b){
			a[n] = b[n];
		}
	})(dcl, {
		// piblic API
		mix: mix,
		delegate: function(o){
			return Object.create(o);
		},
		Super: Super,
		superCall: function(f){ return new Super(f); },
		// protected API starts with _ (don't use it!)
		_p: function(ctor){ return ctor; },   // identity, used to hang on advices
		_e: function(m){ throw Error("dcl: " + m); },  // error function, augmented by debug.js
		_f: function(f, a, n){ var t = f.f(a); t.ctr = f.ctr; return t; },  // supercall instantiation, augmented by debug.js
		// the "buildStubs()" helpers, can be overwritten
		_ec: extractChain = function(bases, name, advice){
			var i = bases.length - 1, r = [], b, f, around = advice == "f";
			for(; b = bases[i]; --i){
				// next line contains 5 intentional assignments
				if((f = b._m) ? (f = f.h).hasOwnProperty(name) && (isSuper(f = f[name]) ? (around ? f.f : (f = f[advice])) : around) : around && (f = name == cname ? b : b[pname][name]) && f !== empty[name]){
					f.ctr = b;
					r.push(f);
				}
			}
			return r;
		},
		_sc: stubChain = function(chain){ // this is "after" chain
			var l = chain.length, f;
			return !l ? 0 : l == 1 ?
				(f = chain[0], function(){
					f.apply(this, arguments);
				}) :
				function(){
					for(var i = 0; i < l; ++i){
						chain[i].apply(this, arguments);
					}
				};
		},
		_ss: stubSuper = function(chain, name){
			var i = 0, f, p = empty[name];
			for(; f = chain[i]; ++i){
				p = isSuper(f) ? (chain[i] = dcl._f(f, p, name)) : f;
			}
			return name != cname ? p : function(){ p.apply(this, arguments); };
		},
		_st: stubChainSuper = function(chain, stub, name){
			var i = 0, f, t, pi = 0;
			for(; f = chain[i]; ++i){
				if(isSuper(f)){
					t = i - pi;
					t = chain[i] = dcl._f(f, !t ? 0 : t == 1 ? chain[pi] : stub(chain.slice(pi, i)), name);
					pi = i;
				}
			}
			t = i - pi;
			return !t ? 0 : t == 1 && name != cname ? chain[pi] : stub(pi ? chain.slice(pi) : chain);
		},
		_sb: /*stub*/ function(id, bases, name, chains){
			var f = chains[name] = extractChain(bases, name, "f");
			return (id ? stubChainSuper(f, stubChain, name) : stubSuper(f, name)) || function(){};
		}
	});

	function buildStubs(meta, proto){
		var weaver = meta.w, bases = meta.b, chains = meta.c;
		for(var name in weaver){
			proto[name] = dcl._sb(weaver[name], bases, name, chains);
		}
	}

	return dcl;
});
