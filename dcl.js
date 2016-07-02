/* UMD.define */ (typeof define=="function"&&define||function(d,f,m){m={module:module,require:require};module.exports=f.apply(null,d.map(function(n){return m[n]||require(n)}))})
([], function () {
	'use strict';

	// set up custom names
	var mname = '_meta', pname = 'prototype', cname = 'constructor';


	// MODULE: restricted Map shim (used by C3 MRO)

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


	// MODULE: C3 MRO

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


	// MODULE: handling properties

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

	var descriptorProperties = {configurable: 1, enumerable: 1, value: 1, writable: 1, get: 1, set: 1};

	function toProperties(x, defaults) {
		var props, descriptors;
		if (x instanceof Prop) {
			props = x.x;
		} else {
			Object.getOwnPropertyNames(x).forEach(function(key) {
				var prop = Object.getOwnPropertyDescriptor(x, key);
				if (prop.get || prop.set) {
					// accessor descriptor
					descriptors = descriptors || {};
					descriptors[key] = prop;
				} else {
					// data descriptor
					var value = prop.value;
					if (value instanceof Prop) {
						props = props || {};
						props[key] = value.x;
					} else {
						if (defaults.detectProps && value && typeof value == 'object') {
							if (Object.keys(value).every(function (name) { return descriptorProperties[name] === 1; })) {
								props = props || {};
								props[key] = value;
								return;
							}
						}
						descriptors = descriptors || {};
						descriptors[key] = prop;
					}
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

	function cloneDescriptor (descriptor) { // shallow copy
		var newDescriptor = {};
		Object.keys(descriptor).forEach(function (name) {
			newDescriptor[name] = descriptor[name];
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
		return typeof value == 'function' ? value : function(descriptor) {
			if (!descriptor.get && !descriptor.set && !descriptor.hasOwnProperty('writable')) {
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
		return typeof value == 'function' ? value : function(descriptor) {
			if (descriptor.hasOwnProperty('value')) {
				descriptor.writable = value;
			}
		};
	}

	function getPropertyDescriptor (o, name) {
		if (o) {
			var next = Object.getPrototypeOf(o);
			for (; next; o = next, next = Object.getPrototypeOf(next)) {
				if (o.hasOwnProperty(name)) {
					return Object.getOwnPropertyDescriptor(o, name);
				}
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


	// MODULE: produce properties

	function recordProp(props, o, recorded) {
		return function (name) {
			if (recorded[name] !== 1) {
				recorded[name] = 1;
				props[name] = Object.getOwnPropertyDescriptor(o, name);
			}
		};
	}

	function populatePropsNative (props, o) {
		if (o) {
			var recorded = {}, next = Object.getPrototypeOf(o);
			for (; next; o = next, next = Object.getPrototypeOf(next)) {
				Object.getOwnPropertyNames(o).forEach(recordProp(props, o, recorded));
			}
		}
		return props;
	}

	// populate properties with simple properties
	function populateProps (props, mixins, special) {
	    var newSpecial = {};
	    mixins.forEach(function (base) {
	        // copy properties for dcl objects
	        if (base[mname]) {
	            var baseProps = base[mname].props;
	            Object.keys(baseProps).forEach(function (name) {
	                if (special.hasOwnProperty(name)) {
	                    newSpecial[name] = special[name];
	                } else {
	                    props[name] = baseProps[name];
	                }
	            });
	            return;
	        }
	        // copy properties for regular objects
			populatePropsNative(props, base[pname]);
	    });
	    return newSpecial;
	}

	function weaveProp (name, bases, weaver) {
	    var state = {prop: null};
	    bases.forEach(function (base) {
	        var prop;
	        if (base[mname]) {
	            var baseProps = base[mname].props;
	            if (baseProps.hasOwnProperty(name)) {
					prop = baseProps[name];
				}
	        } else {
	            prop = getPropertyDescriptor(base[pname], name);
				if (!prop && name == cname) {
					prop = {configurable: true, enumerable: false, writable: true, value: base};
				}
	        }
			prop && weaver.weave(state, prop, name);
	    });
	    weaver.weave(state);
	    return state.prop;
	}

	function weaveSuper (state, prop, name) {
	    if (!prop) {
	        return;
	    }
	    var newProp = cloneDescriptor(prop);
	    if (prop.get || prop.set) {
	        // accessor
	        if (prop.get) {
	            if (isSuper(prop.get)) {
					if (!prop.get.spr.around) {
						return; // skip the descriptor
					}
					if (state.prop) {
		                newProp.get = prop.get.spr.around(
		                    state.prop.get || state.prop.set ?
		                        state.prop.get : adaptValue(state.prop.value));
					} else {
						newProp.get = prop.get.spr.around(null);
					}
	            }
	        }
	        if (prop.set) {
	            if (isSuper(prop.set)) {
					if (!prop.set.spr.around) {
						return; // skip the descriptor
					}
	                newProp.set = prop.set.spr.around(state.prop && state.prop.set || null);
	            }
	        }
	    } else {
	        // data
	        if (isSuper(prop.value)) {
				if (!prop.value.spr.around) {
					return; // skip the descriptor
				}
				if (state.prop) {
		            newProp.value = prop.value.spr.around(
		                state.prop.get || state.prop.set ?
		                    adaptGet(state.prop.get) : state.prop.value);
				} else {
					newProp.value = prop.value.spr.around(name !== cname && empty[name] || null);
				}
	        }
	    }
	    state.prop = newProp;
	}

	function weaveChain (state, prop, name) {
	    state.backlog = state.backlog || [];
	    if (!prop) {
			return state.backlog.length && processBacklog(state, this.reverse);
	    }
	    var newProp = cloneDescriptor(prop);
	    if (prop.get || prop.set) {
	        // accessor
	        if (isSuper(prop.get)) {
				if (!prop.get.spr.around) {
					return; // skip the descriptor
				}
				state.backlog.length && processBacklog(state, this.reverse);
				if (state.prop) {
		            newProp.get = prop.get.spr.around(
		                state.prop.get || state.prop.set ?
		                    state.prop.get : adaptValue(state.prop.value));
				} else {
					newProp.get = prop.get.spr.around(null);
				}
	            state.prop = null;
	        }
	    } else {
	        // data
	        if (isSuper(prop.value)) {
				if (!prop.value.spr.around) {
					return; // skip the descriptor
				}
	            state.backlog.length && processBacklog(state, this.reverse);
				if (state.prop) {
		            newProp.value = prop.value.spr.around(
		                state.prop.get || state.prop.set ?
		                    adaptGet(state.prop.get) : state.prop.value);
				} else {
					newProp.value = prop.value.spr.around(name !== cname && empty[name] || null);
				}
	            state.prop = null;
	        }
	    }
	    if (state.prop) {
	        state.backlog.push(convertToValue(state.prop));
	    }
	    state.prop = newProp;
	}

	function processBacklog (state, reverse) {
		state.backlog.push(convertToValue(state.prop));
		state.prop = stubChain(reverse ? state.backlog.reverse() : state.backlog);
		state.backlog = [];
	}

	function adaptValue (f) {
	    return f ? function () { return f; } : null;
	}

	function adaptGet (f) {
	    return f ? function () { return f.call(this).apply(this, arguments); } : null;
	}

	function convertToValue (prop) {
	    if (prop.get || prop.set) {
	        var newProp = cloneDescriptor(prop);
	        delete newProp.get;
	        delete newProp.set;
	        newProp.value = adaptGet(prop.get);
	        return newProp;
	    }
	    return prop;
	}

	function stubChain (chain) {
	    var newProp = cloneDescriptor(chain[chain.length - 1]);

	    // extract functions
	    chain = chain.map(function (prop) {
	        return prop.get || prop.set ? adaptGet(prop.get) : prop.value;
	    });

	    newProp.value = function chainStub () {
	        for (var i = 0; i < chain.length; ++i) {
	            chain[i].apply(this, arguments);
	        }
	    };

	    return newProp;
	}

	function getAccessorSideAdvices (name, bases, propName) {
	    var before = [], after = [];
	    bases.forEach(function (base) {
	        if (base[mname]) {
	            var prop = base[mname].props[name];
	            if (typeof prop == 'object') {
	                if (prop.get || prop.set) {
	                    var f = prop[propName];
	                    if (isSuper(f)) {
	                        f.spr.before && before.push(f.spr.before);
	                        f.spr.after  && after .push(f.spr.after);
	                    }
	                }
	            }
	        }
	    });
		if (before.length > 1) { before.reverse(); }
	    return {before: before, after: after};
	}

	function getDataSideAdvices (name, bases) {
	    var before = [], after = [];
	    bases.forEach(function (base) {
	        if (base[mname]) {
	            var prop = base[mname].props[name];
	            if (typeof prop == 'object') {
	                var f = prop.get || prop.set ? prop.get : prop.value;
	                if (isSuper(f)) {
	                    f.spr.before && before.push(f.spr.before);
	                    f.spr.after  && after .push(f.spr.after);
	                }
	            }
	        }
	    });
		if (before.length > 1) { before.reverse(); }
		return {before: before, after: after};
	}

	function createStub (aroundStub, beforeChain, afterChain) {
		var beforeLength = beforeChain.length, afterLength = afterChain.length,
			stub = function () {
				var result, thrown, i;
				// running the before chain
				for (i = 0; i < beforeLength; ++i) {
					beforeChain[i].apply(this, arguments);
				}
				// running the around chain
				if (aroundStub) {
					try {
						result = aroundStub.apply(this, arguments);
					} catch (error) {
						result = error;
						thrown = true;
					}
				}
				// running the after chain
				for (i = 0; i < afterLength; ++i) {
					afterChain[i].call(this, arguments, result,	makeReturn, makeThrow);
				}
				if (thrown) {
					throw result;
				}
				return result;

				function makeReturn (value) { result = value; thrown = false; }
				function makeThrow  (value) { result = value; thrown = true; }
			};
		stub.advices = {around: aroundStub, before: beforeChain, after: afterChain};
		return stub;
	}


	// MODULE: dcl (the main function)

	var weaveBeforeChain = {name: 'beforeChain', weave: weaveChain, reverse: true},
		weaveAfterChain  = {name: 'afterChain',  weave: weaveChain},
		weaveAroundChain = {name: 'aroundChain', weave: weaveSuper};

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
		var faux = {}, special = {};
		faux[mname] = {bases: bases, props: props, special: special};
		dcl.chainAfter(faux, cname);
		bases.push(faux);
		mixins.push(faux);

		// collect meta

		// merge from bases
		superClass.forEach(function (base) {
			if (base[mname]) {
				var baseSpecial = base[mname].special;
				Object.keys(baseSpecial).forEach(function (name) {
					dcl.chainWith(faux, name, baseSpecial[name]);
				});
			}
		});

		// inspect own props
		Object.keys(props).forEach(function (name) {
			if (!special.hasOwnProperty(name)) {
				var prop = props[name];
				if (prop.get || prop.set) {
					if (isSuper(prop.get) || isSuper(prop.set)) {
						dcl.chainWith(faux, name, weaveAroundChain);
					}
				} else {
					if (isSuper(prop.value)) {
						dcl.chainWith(faux, name, weaveAroundChain);
					}
				}
			}
		});

		// update our meta information
		faux[mname].special = special;

		// collect simple props, and a list of special props
		var finalProps = {}, finalSpecial = populateProps(finalProps, mixins, special);
		if (!finalSpecial.hasOwnProperty(cname)) {
			finalSpecial[cname] = special.hasOwnProperty(cname) ? special[cname] : dcl.weaveAfterChain;
		}

		// process special props
		var reversedBases;
		Object.keys(finalSpecial).forEach(function (name) {
			var prop = weaveProp(name, bases, finalSpecial[name]);
			if (!prop) {
				prop = {configurable: true, enumerable: false, writable: true, value: function nop () {}};
			}
			var	newProp = cloneDescriptor(prop), advices;
			if (prop.get || prop.set) {
				// accessor descriptor
				advices = getAccessorSideAdvices(name, bases, 'get');
				newProp.get = createStub(prop.get, advices.before, advices.after);
				advices = getAccessorSideAdvices(name, bases, 'set');
				newProp.set = createStub(prop.set, advices.before, advices.after);
			} else {
				// data descriptor
				advices = getDataSideAdvices(name, bases);
				newProp.value = createStub(prop.value, advices.before, advices.after);
			}
			finalProps[name] = newProp;
		});

		return dcl._makeCtr(baseClass, finalProps, faux[mname]);
	}

	function makeCtr (baseClass, finalProps, meta) {
		var proto = baseClass ?
				Object.create(baseClass[pname], finalProps) :
				Object.defineProperties({}, finalProps),
			ctr = proto[cname];

		ctr[mname] = meta;
		ctr[pname] = proto;
		meta.bases[meta.bases.length - 1] = ctr;

		return ctr;
	}


	// build export

	// guts, do not use them!

	dcl._error = function (msg) {
		throw new Error(msg);
	};
	dcl._makeSuper = makeSuper;
	dcl._makeCtr   = makeCtr;

	// utilities

	dcl.populatePropsNative = populatePropsNative;

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

	function chainWith (ctr, name, chain) {
		if (ctr && ctr[mname]) {
			var special = ctr[mname].special;
			if (special.hasOwnProperty(name)) {
				var own = special[name];
				if (own === chain ||
						own.weave === chain.weave && !(!own.reverse ^ !chain.reverse) ||
						chain.weave === weaveSuper && !chain.reverse) {
					return true;
				}
				if (own.weave !== weaveSuper || own.reverse) {
					dcl._error('different weavers: ' + name);
				}
			}
			special[name] = chain;
			return true;
		}
		return false;
	}

	dcl.weaveBeforeChain = weaveBeforeChain;
	dcl.weaveAfterChain  = weaveAfterChain;
	dcl.weaveAroundChain = weaveAroundChain;

	dcl.chainWith   = chainWith;
	dcl.chainBefore = function (ctr, name) { return dcl. chainWith(ctr, name, dcl.weaveBeforeChain); };
	dcl.chainAfter  = function (ctr, name) { return dcl. chainWith(ctr, name, dcl.weaveAfterChain); };

	// AOP

	var Advice = dcl(dcl.Super, {
		declaredClass: "dcl.Advice",
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
