/* UMD.define */ (typeof define=="function"&&define||function(d,f,m){m={module:module,require:require};module.exports=f.apply(null,d.map(function(n){return m[n]||require(n)}))})
([], function(){
	'use strict';

	// set up custom names
	var mname = '_meta', pname = 'prototype', cname = 'constructor';


	var M; // our map implementation if not defined
	if (typeof Map == 'undefined') {
		// our fake, inefficient, incomplete, yet totally correct Map
		M = function () {
			this.list = [];
			this.size = 0;
		};
		M.prototype = {
			has: function (key) { return this.get(key); },
			get: function (key) {
				for (var i = 0, n = this.list.length; i < n; i += 2) {
					if (key === this.list[i]) {
						return this.list[i + 1];
					}
				}
				// returns undefined if not found
			},
			set: function (key, value) {
				for (var i = 0, n = this.list.length; i < n; i += 2) {
					if (key === this.list[i]) {
						this.list[i + 1] = value;
						return this;
					}
				}
				this.list.push(key, value);
				++this.size;
				return this;
			}
		};
	} else {
		M = Map;
	}

	// C3MRO implementation
	function c3mro (bases) {
		// build a connectivity matrix
		var connectivity = new M();
		bases.forEach(function (base) {
			(base[mname] ? base[mname].bases : [base]).forEach(function (base, index, array) {
				if (connectivity.has(base)) {
					var value = connectivity.get(base);
					++value.counter;
					if (index) {
						value.links.push(array[index - 1]);
					}
				} else {
					connectivity.set(base, {
						links:   index ? [array[index - 1]] : [],
						counter: index + 1 == array.length ? 0 : 1
					});
				}
			});
		});
		// Kahn's algorithm
		var output = [], unreferenced = [];
		// find unreferenced bases
		bases.forEach(function (base) {
			var last = base[mname] ? base[mname].bases[base[mname].bases.length - 1] : base;
			if (!connectivity.get(last).counter) {
				unreferenced.push(last);
			}
		});
		while (unreferenced.length) {
			var base = unreferenced.pop();
			output.push(base);
			var value = connectivity.get(base);
			value.links.forEach(updateCounter);
		}
		// final checks and return
		if (connectivity.size != output.length) {
			dcl._error('cycle');
		}
		return output;

		function updateCounter (base) {
			var value = connectivity.get(base);
			if (!--value.counter) {
				unreferenced.push(base);
			}
		}
	}


	// handling properties

	function Prop (x) {
		this.x = x;
	}

	function prop(x) { return new Prop(x); }

	function updateProps (props, defaults, augmentDescriptor, augmentWritable) {
		if ('configurable' in defaults) {
			props = props.map(augmentDescriptor('configurable', defaults.configurable));
		}
		if ('enumerable' in defaults) {
			props = props.map(augmentDescriptor('enumerable', defaults.enumerable));
		}
		if ('writable' in defaults) {
			props = props.map(augmentWritable(defaults.writable));
		}
		return props;
	}

	function toProperties(x, defaults) {
		var props, descriptors;
		if (x instanceof Prop) {
			props = x.x;
		} else {
			Object.getOwnPropertyNames(x).forEach(function(key) {
				var value = x[key];
				if (value instanceof Prop) {
					props = props || {};
					props[key] = value.x;
				} else {
					descriptors = descriptors || {};
					descriptors[key] = Object.getOwnPropertyDescriptor(x, key);
				}
			});
		}
		if (props) {
			props = updateProps(props, defaults, augmentDescriptor, augmentWritable);
		}
		if (descriptors) {
			descriptors = updateProps(descriptors, defaults, replaceDescriptor, replaceWritable);
		}
		if (descriptors && props) {
			Object.keys(props).forEach(function(key) {
				descriptors[key] = props[key];
			});
		}
		return descriptors || props || {};
	}

	var descriptorProperties = ['configurable', 'enumerable', 'value', 'writable', 'get', 'set'];
	function cloneDescriptor (descriptor) {
		var newDescriptor = {};
		descriptorProperties.forEach(function (name) {
			if (name in descriptor) {
				newDescriptor[name] = descriptor[name];
			}
		});
		return newDescriptor;
	}

	function augmentDescriptor(name, value) {
		return typeof value == 'function' ? value(name) : function(descriptor) {
			if (!descriptor.hasOwnProperty(name)) {
				descriptor[name] = value;
			}
		};
	}

	function augmentWritable(value) {
		return typeof value == 'function' ? value(name) : function(descriptor) {
			if (descriptor.hasOwnProperty('value') && !descriptor.hasOwnProperty('writable')) {
				descriptor.writable = value;
			}
		};
	}

	function replaceDescriptor(name, value) {
		return typeof value == 'function' ? value(name) : function(descriptor) {
			descriptor[name] = value;
		};
	}

	function replaceWritable(value) {
		return typeof value == 'function' ? value(name) : function(descriptor) {
			if (descriptor.hasOwnProperty('value')) {
				descriptor.writable = value;
			}
		};
	}

	function getPropertyDescriptor (o, name) {
		for (; o && o !== Object; o = Object.getPrototypeOf(o)) {
			if (o.hasOwnProperty(name)) {
				return Object.getOwnPropertyDescriptor(o, name);
			}
		}
		return null;
	}


	// common globals

	var empty = {};

	function Super (f) { this.around = f; }
	function isSuper (f) { return f && f.spr instanceof Super; }
	function makeSuper (advice, S) {
		var f = function superNop () {};
		f.spr = new S(advice);
		return f;
	}

	// utilities

	function mixNames (a, b) {
		Object.getOwnPropertyNames(b).forEach(function (name) {
			if (b[name] === 1) {
				a[name] = 1;
			}
		});
	}


	// build chains

	// TODO: make sure to call primordial methods from supercalls
	// TODO: make sure that before/after advices work with chains
	// TODO: add error information for illegal situations

	function extractChain (name, bases, upTo) {
		return bases.slice(0, upTo + 1).map(function (base) {
			var value;
			if (base[mname]) {
				value = base[mname].props[name];
				if (typeof value != 'object') {
					return null;
				}
				value = value.value;
			} else {
				value = base[pname][name];
				if (value === empty[name]) {
					return null;
				}
			}
			if (typeof value != 'function') {
				dcl._error('chain has non-function');
			}
			return value;
		}).filter(function (f) { return isSuper(f) ? f.spr.around : f; });
	}

	function buildChainStub (methods, from) {
		from = from || 0;
		if (from < methods.length) {
			var f = methods[from];
			if (isSuper(f)) {
				return f.spr.around(buildChainStub(methods, from + 1));
			}
			for(var i = from + 1; i < methods.length && !isSuper(methods[i]); ++i);
			var chain = methods.slice(from, i);
			if (i < methods.length) {
				chain.push(buildChainStub(methods, i));
			}
			var n = chain.length;
			return n === 1 ? chain[0] : function chainStub () {
				for (var i = 0; i < n; ++i) {
					chain[i].apply(this, arguments);
				}
			};
		}
		return null;
	}

	function collectChainAdvice (name, bases, from, propName, adviceName) {
		return bases.slice(0, from + 1).map(function (base) {
			if (base[mname]) {
				var f = base[mname].props[name][propName];
				return isSuper(f) && f.spr[adviceName];
			}
			return null;
		}).filter(function (f) { return f; });
	}

	function buildAroundStub (name, bases, from, propName) {
		var method;
		if (from >= 0) {
			var base = bases[from];
			if (base[mname]) {
				var f = base[mname].props[name][propName];
				if (isSuper(f)) {
					if (f.spr.around) {
						return f.spr.around(buildAroundStub(name, bases, from - 1, propName));
					}
					return buildAroundStub(name, bases, from - 1, propName);
				}
				return f;
			} else {
				if (propName === 'value') {
					method = base[pname][name];
					if (method !== empty[name]) {
						return method;
					}
					return buildAroundStub(name, bases, from - 1, propName);
				}
				return null;
			}
		}
		method = empty[name];
		return typeof method == 'function' ? method : null;
	}

	function buildSuperStub (name, bases, from, propName) {
		var aroundStub = buildAroundStub(name, bases, from, propName),
			beforeStub = buildChainStub(collectChainAdvice(name, bases, from, propName, 'before').reverse()),
			afterStub  = buildChainStub(collectChainAdvice(name, bases, from, propName, 'after'));
		return createStub(aroundStub, beforeStub, afterStub);
	}

	function createStub (aroundStub, beforeStub, afterStub) {
		var stub;
		// let's generate all 8 permutations for efficiency
		if (aroundStub) {
			if (beforeStub) {
				if (afterStub) {
					stub = function full () {
						var result, thrown;
						// running the before chain
						beforeStub.apply(this, arguments);
						// running the around chain
						try {
							result = aroundStub.apply(this, arguments);
						} catch (error) {
							result = error;
							thrown = true;
						}
						// running the after chain
						afterStub.call(this, arguments, result,
							function makeReturn (value) { result = value; thrown = false; },
							function makeThrow  (value) { result = value; thrown = true; }
						);
						if (thrown) {
							throw result;
						}
						return result;
					};
				} else {
					stub = function before_around () {
						// running the before chain
						beforeStub.apply(this, arguments);
						// running the around chain
						return aroundStub.apply(this, arguments);
					};
				}
			} else {
				if (afterStub) {
					stub = function around_after () {
						var result, thrown;
						// running the around chain
						try {
							result = aroundStub.apply(this, arguments);
						} catch (error) {
							result = error;
							thrown = true;
						}
						// running the after chain
						afterStub.call(this, arguments, result,
							function makeReturn (value) { result = value; thrown = false; },
							function makeThrow  (value) { result = value; thrown = true; }
						);
						if (thrown) {
							throw result;
						}
						return result;
					};
				} else {
					stub = aroundStub;
				}
			}
		} else {
			if (beforeStub) {
				if (afterStub) {
					stub = function before_after () {
						// running the before chain
						beforeStub.apply(this, arguments);
						// running the after chain
						var result, thrown;
						afterStub.call(this, arguments, result,
							function makeReturn (value) { result = value; thrown = false; },
							function makeThrow  (value) { result = value; thrown = true; }
						);
						if (thrown) {
							throw result;
						}
						return result;
					};
				} else {
					stub = beforeStub;
				}
			} else {
				if (afterStub) {
					stub = function after () {
						// running the after chain
						var result, thrown;
						afterStub.call(this, arguments, result,
							function makeReturn (value) { result = value; thrown = false; },
							function makeThrow  (value) { result = value; thrown = true; }
						);
						if (thrown) {
							throw result;
						}
						return result;
					};
				} else {
					stub = function nop () {};
				}
			}
		}
		stub.advices = {around: aroundStub, before: beforeStub, after: afterStub};
		return stub;
	}


	// main function

	function dcl (superClass, props, options) {
		// parse arguments
		if (superClass instanceof Array) {
			// skip
		} else if (typeof superClass == 'function') {
			superClass = [superClass];
		} else if (!superClass) {
			superClass = [];
		} else {
			options = props;
			props = superClass;
			superClass = [];
		}
		props = toProperties(props || {}, options || {});

		// find the base class, and mixins
		var bases = [], baseClass = superClass[0], mixins = [], baseIndex = -1;
		if (superClass.length) {
			if (superClass.length > 1) {
				bases = c3mro(superClass).reverse();
				if (baseClass[mname]) {
					baseIndex = baseClass[mname].bases.length - 1;
				} else {
					mixins = bases.slice(1);
					baseIndex = 0;
				}
			} else {
				if (baseClass[mname]) {
					bases = baseClass[mname].bases.slice(0);
					baseIndex = bases.length - 1;
				} else {
					bases = [baseClass];
					baseIndex = 0;
				}
			}
			if (bases[baseIndex] === baseClass) {
				mixins = bases.slice(baseIndex + 1);
			} else {
				baseClass = null;
				mixins = bases.slice(0);
			}
		}

		// add a stand-in for our future constructor
		var faux = {};
		faux[mname] = {bases: bases, props: props, before: {}, after: {}, advice: {}};
		bases.push(faux);
		mixins.push(faux);

		// collect meta
		var names = {beforeChain: {}, afterChain: {}, adviceChain: {}};
		names.afterChain[cname] = 1;
		// merge from bases
		superClass.forEach(function (base) {
			if (base[mname]) {
				var meta = base[mname];
				mixNames(names.beforeChain, meta.before);
				mixNames(names.afterChain,  meta.after);
				mixNames(names.adviceChain, meta.advice);
			}
		});
		// inspect own props
		Object.keys(props).forEach(function (name) {
			var prop = props[name];
			if (prop.get || prop.set) {
				if (isSuper(prop.get) || isSuper(prop.set)) {
					names.adviceChain[name] = 1;
				}
			} else {
				if (isSuper(prop.value)) {
					names.adviceChain[name] = 1;
				}
			}
		});

		// update our meta information
		faux[mname].before = names.beforeChain;
		faux[mname].after  = names.afterChain;
		faux[mname].advice = names.adviceChain;
		dcl._verifyChains(faux[mname]);

		// collect simple properties (no chains, no super calls)
		var finalProps = {};
		mixins.forEach(function (base) {
			if (base[mname]) {
				var props = base[mname].props;
				Object.keys(props).forEach(function (name) {
					if (names.adviceChain[name] !== 1 &&
							names.afterChain [name] !== 1 &&
							names.beforeChain[name] !== 1) {
						finalProps[name] = props[name];
					}
				});
			} else {
				var proto = base[pname], recorded = {};
				while (proto && proto !== Object) {
					Object.getOwnPropertyNames(proto).forEach(function (name) {
						if (recorded[name] !== 1 &&
								names.adviceChain[name] !== 1 &&
								names.afterChain [name] !== 1 &&
								names.beforeChain[name] !== 1) {
							finalProps[name] = Object.getOwnPropertyDescriptor(base[pname], name);
							recorded[name] = 1;
						}
					});
					proto = Object.getPrototypeOf(proto);
				}
			}
		});

		// build stubs for super calls
		var stopAt = Math.max(0, baseIndex);
		Object.getOwnPropertyNames(names.adviceChain).forEach(function (name) {
			var base, i, props, prop, newGetter, newSetter, newProp;
			// find first occurance
			for (i = bases.length - 1; i >= stopAt; --i) {
				base = bases[i];
				if (base[mname]) {
					props = base[mname].props;
					if (props.hasOwnProperty(name)) {
						prop = props[name];
						if (prop.get || prop.set) {
							newGetter = newSetter = null;
							if (prop.get && isSuper(prop.get)) {
								// build a super stub
								newGetter = buildSuperStub(name, bases, i, 'get');
							}
							if (prop.set && isSuper(prop.set)) {
								// build a super stub
								newSetter = buildSuperStub(name, bases, i, 'set');
							}
							if (newGetter || newSetter) {
								newProp = cloneDescriptor(prop);
								if (newGetter) {
									newProp.get = newGetter;
								}
								if (newSetter) {
									newProp.set = newSetter;
								}
								finalProps[name] = newProp;
								break;
							}
						} else {
							if (prop.value && isSuper(prop.value)) {
								newProp = cloneDescriptor(prop);
								newProp.value = buildSuperStub(name, bases, i, 'value');
								finalProps[name] = newProp;
								break;
							}
						}
						finalProps[name] = prop;
						break;
					}
				}
			}
		});

		// build stubs for after chains
		Object.getOwnPropertyNames(names.afterChain).forEach(function (name) {
			if (names.adviceChain[name] === 1) {
				return;
			}
			var base, i, props, prop, newProp;
			// find first occurance
			for (i = bases.length - 1; i >= stopAt; --i) {
				base = bases[i];
				if (base[mname]) {
					props = base[mname].props;
					if (props.hasOwnProperty(name)) {
						prop = props[name];
						finalProps[name] = newProp = cloneDescriptor(prop);
						newProp.value = buildChainStub(extractChain(name, bases, i)) || function nop () {};
						delete newProp.get;
						delete newProp.set;
						break;
					}
				}
			}
			if (i < stopAt && name === cname) {
				finalProps[name] = {
					configurable: true,
					enumerable: false,
					writable: true,
					value: baseClass ?
						function proxy () { baseClass.apply(this, arguments); } :
						function nop () {}
				};
			}
		});

		// build stubs for before chains
		Object.getOwnPropertyNames(names.beforeChain).forEach(function (name) {
			if (names.adviceChain[name] === 1) {
				return;
			}
			var base, i, props, prop, newProp;
			// find first occurance
			for (i = bases.length - 1; i >= stopAt; --i) {
				base = bases[i];
				if (base[mname]) {
					props = base[mname].props;
					if (props.hasOwnProperty(name)) {
						prop = props[name];
						finalProps[name] = newProp = cloneDescriptor(prop);
						newProp.value = buildChainStub(extractChain(name, bases, i).reverse()) || function nop () {};
						delete newProp.get;
						delete newProp.set;
						break;
					}
				}
			}
		});

		// create new prototype
		var proto = baseClass ? Object.create(baseClass[pname], finalProps) :
				Object.defineProperties({}, finalProps);

		// create a constructor
		var ctr = proto[cname];
		ctr[mname] = faux[mname];
		ctr[pname] = proto;
		bases[bases.length - 1] = ctr;

		return ctr;
	}


	// build export

	// guts, do not use them!

	dcl._error = function (msg) {
		throw new Error(msg);
	};
	dcl._makeSuper = makeSuper;
	dcl._verifyChains = function (meta) {};

	// meta

	dcl.Prop = Prop;
	dcl.prop = prop;

	function isInstanceOf (o, ctr) {
		if (o instanceof ctr) {
			return true;
		}
		if (o && o[cname] && o[cname][mname]) {
			for (var bases = o[cname][mname].bases, i = bases.length - 2; i >= 0; --i) {
				var base = bases[i];
				if (base === ctr || !base[mname] && base[pname] instanceof ctr) {
					return true;
				}
			}
		}
		return false;
	}

	dcl.isInstanceOf = isInstanceOf;

	// super

	dcl.Super = Super;
	dcl.isSuper = isSuper;
	dcl.superCall = function (f) { return dcl._makeSuper(f, Super); };

	// chains

	function chain (what, opposite) {
		return function chain (ctr, name) {
			if (ctr && ctr[mname]) {
				if (ctr[mname][opposite][name] === 1) {
					dcl._error('attempt to chain before and after');
				}
				ctr[mname][what][name] = 1;
				return true;
			}
			return false;
		};
	}

	function isChained (what) {
		return function isChained (ctr, name) {
			if (ctr && ctr[mname]) {
				return ctr[mname][what][name] === 1;
			}
			return false;
		};
	}

	dcl.chainBefore = chain('before', 'after');
	dcl.chainBefore = chain('after',  'before');

	dcl.isChainedBefore = isChained('before');
	dcl.isChainedAfter  = isChained('after');

	// AOP

	var Advice = dcl(dcl.Super, {
		//declaredClass: "dcl.Advice",
		constructor: function () {
			this.before = this.around.before;
			this.after  = this.around.after;
			this.around = this.around.around;
		}
	});

	dcl.advise = function (advice) { return dcl._makeSuper(advice, Advice); };

	dcl.before = function (f) { return dcl.advise({before: f}); };
	dcl.after  = function (f) { return dcl.advise({after:  f}); };
	dcl.around = dcl.superCall;

	// export

	return dcl;
});
