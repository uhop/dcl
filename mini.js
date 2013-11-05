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
		var bases = [0], proto, base, ctor, meta, connectionMap,
			output, vector, superClasses, i, j = 0, n;

		if(superClass){
			if(superClass instanceof Array){
				// mixins: C3 MRO
				connectionMap = {};
				superClasses = superClass.slice(0).reverse();
				for(i = superClasses.length - 1; i >= 0; --i){
					base = superClasses[i];
					// pre-process a base
					// 1) add a unique id
					base._u = base._u || counter++;
					// 2) build a connection map and the base list
					if((proto = base._m)){   // intentional assignment
						for(vector = proto.b, j = vector.length - 1; j > 0; --j){
							n = vector[j]._u;
							connectionMap[n] = (connectionMap[n] || 0) + 1;
						}
						superClasses[i] = vector.slice(0);
					}else{
						superClasses[i] = [base];
					}
				}
				// build output
				output = {};
				c: while(superClasses.length){
					for(i = 0; i < superClasses.length; ++i){
						vector = superClasses[i];
						base = vector[0];
						n = base._u;
						if(!connectionMap[n]){
							if(!output[n]){
								bases.push(base);
								output[n] = 1;
							}
							vector.shift();
							if(vector.length){
								--connectionMap[vector[0]._u];
							}else{
								superClasses.splice(i, 1);
							}
							continue c;
						}
					}
					// error
					dcl._e("cycle", props, superClasses);
				}
				// calculate a base class
				superClass = superClass[0];
				j = bases.length - ((meta = superClass._m) && superClass === bases[bases.length - (j = meta.b.length)] ? j : 1) - 1; // intentional assignments
			}else{
				// 1) add a unique id
				superClass._u = superClass._u || counter++;
				// 2) single inheritance
				bases = bases.concat((meta = superClass._m) ? meta.b : superClass);   // intentional assignment
			}
		}
		// create a base class
		proto = superClass ? dcl.delegate(superClass[pname]) : {};
		// the next line assumes that constructor is actually named "constructor", should be changed if desired
		vector = superClass && (meta = superClass._m) ? dcl.delegate(meta.w) : {constructor: 2};   // intentional assignment

		// create prototype: mix in mixins and props
		for(; j > 0; --j){
			base = bases[j];
			meta = base._m;
			dcl.mix(proto, meta && meta.h || base[pname]);
			if(meta){
				for(n in (superClasses = meta.w)){    // intentional assignment
					vector[n] = (+vector[n] || 0) | superClasses[n];
				}
			}
		}
		for(n in props){
			if(isSuper(meta = props[n])){  // intentional assignment
				vector[n] = +vector[n] || 0;
			}else{
				proto[n] = meta;
			}
		}

		// create stubs with fake constructor
		//
		meta = {b: bases, h: props, w: vector, c: {}};
		// meta information is coded like that:
		// b: an array of super classes (bases) and mixins
		// h: a bag of immediate prototype properties for the constructor
		// w: a bag of chain instructions (before is 1, after is 2)
		// c: a bag of chains (ordered arrays)

		bases[0] = {_m: meta, prototype: proto};
		buildStubs(meta, proto);
		ctor = proto[cname];

		// put in place all decorations and return a constructor
		ctor._m  = meta;
		ctor[pname] = proto;
		//proto.constructor = ctor; // uncomment if constructor is not named "constructor"
		bases[0] = ctor;

		// each constructor may have two properties on it:
		// _m: a meta information object as above
		// _u: a unique number, which is used to id the constructor

		return dcl._p(ctor);    // fully prepared constructor
	}

	// decorators

	function Super(f){ this.f = f; }
	function isSuper(f){ return f && f.spr instanceof Super; }

	// utilities

	function allKeys(o){
		var keys = [];
		for(var name in o){
			keys.push(name);
		}
		return keys;
	}

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
		allKeys: allKeys,
		Super: Super,
		superCall: function superCall(f){ return dcl._mk(f); },

		// protected API starts with _ (don't use it!)

		// make a Super marker
		_mk: function makeSuper(f, S){ var fn = function(){}; fn.spr = new (S || Super)(f); return fn; },

		// post-processor for a constructor, can be used to add more functionality
		// or augment its behavior
		_p: function(ctor){ return ctor; },   // identity, used to hang on advices

		// error function, augmented by debug.js
		_e: function(msg){ throw Error("dcl: " + msg); },

		// supercall instantiation, augmented by debug.js
		_f: function(f, a, n){ var t = f.spr.f(a); t.ctr = f.ctr; return t; },

		// the "buildStubs()" helpers, can be overwritten
		_ec: extractChain = function(bases, name, advice){
			var i = bases.length - 1, chain = [], base, f, around = advice == "f";
			for(; base = bases[i]; --i){
				// next line contains 5 intentional assignments
				if((f = base._m) ? (f = f.h).hasOwnProperty(name) && (isSuper(f = f[name]) ? (around ? f.spr.f : (f = f.spr[advice])) : around) : around && (f = name == cname ? base : base[pname][name]) && f !== empty[name]){
					f.ctr = base;
					chain.push(f);
				}
			}
			return chain;
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
			var i = 0, f, diff, pi = 0;
			for(; f = chain[i]; ++i){
				if(isSuper(f)){
					diff = i - pi;
					diff = chain[i] = dcl._f(f, !diff ? 0 : diff == 1 ? chain[pi] : stub(chain.slice(pi, i)), name);
					pi = i;
				}
			}
			diff = i - pi;
			return !diff ? 0 : diff == 1 && name != cname ? chain[pi] : stub(pi ? chain.slice(pi) : chain);
		},
		_sb: /*generic stub*/ function(id, bases, name, chains){
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
