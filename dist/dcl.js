(function(_,f){window.dcl=f();})
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

	function c3mro (bases, props) {
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
			dcl._error('cycle', bases, props);
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
		if (x instanceof dcl.Prop) {
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
					if (value instanceof dcl.Prop) {
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
		while (o && o !== Object.prototype) {
			if (o.hasOwnProperty(name)) {
				return Object.getOwnPropertyDescriptor(o, name);
			}
			o = Object.getPrototypeOf(o);
		}
		return null;
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
		var recorded = {};
		while (o && o !== Object.prototype) {
			Object.getOwnPropertyNames(o).forEach(recordProp(props, o, recorded));
			o = Object.getPrototypeOf(o);
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

	var empty = {};

	function weaveProp (name, bases, weaver, props) {
	    var state = {prop: null, backlog: []};
		weaver.start && weaver.start(state);
	    bases.forEach(function (base, index) {
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
			if (!prop) {
				return;
			}
			var newProp = cloneDescriptor(prop), prevProp, superArg;
		    if (prop.get || prop.set) {
		        // accessor
				var superGet = isSuper(prop.get) && prop.get.spr.around,
					superSet = isSuper(prop.set) && prop.set.spr.around;
				if (superGet || superSet) {
					processBacklog(state, weaver);
					prevProp = state.prop;
				}
				if (superGet) {
					if (typeof prop.get.spr.around != 'function') {
						dcl._error('wrong super get call', base, name, index, props);
					}
					superArg = null;
					if (prevProp) {
						superArg = prevProp.get || prevProp.set ?
							prevProp.get : adaptValue(prevProp.value);
					}
					if (superArg && typeof superArg != 'function') {
						dcl._error('wrong super get arg', base, name, index, props);
					}
					newProp.get = prop.get.spr.around(superArg);
					if (typeof newProp.get != 'function') {
						dcl._error('wrong super get result', base, name, index, props);
					}
		            state.prop = null;
				}
				if (superSet) {
					if (typeof prop.set.spr.around != 'function') {
						dcl._error('wrong super set call', base, name, index, props);
					}
					superArg = prevProp && prevProp.set;
					if (superArg && typeof superArg != 'function') {
						dcl._error('wrong super set arg', base, name, index, props);
					}
		            newProp.set = prop.set.spr.around(superArg);
					if (typeof newProp.set != 'function') {
						dcl._error('wrong super set result', base, name, index, props);
					}
					state.prop = null;
		        }
				if ((!prop.get || isSuper(prop.get) && !prop.get.spr.around) && (!prop.set || isSuper(prop.set) && !prop.set.spr.around)) {
					return; // skip descriptor: no actionable value
				}
		    } else {
		        // data
		        if (isSuper(prop.value) && prop.value.spr.around) {
		            processBacklog(state, weaver);
					prevProp = state.prop;
					if (typeof prop.value.spr.around != 'function') {
						dcl._error('wrong super value call', base, name, index, props);
					}
					if (prevProp) {
			            superArg = prevProp.get || prevProp.set ?
			                    adaptGet(prevProp.get) : prevProp.value;
					} else {
						superArg = name !== cname && empty[name];
					}
					if (superArg && typeof superArg != 'function') {
						dcl._error('wrong super value arg', base, name, index, props);
					}
					newProp.value = prop.value.spr.around(superArg);
					if (typeof newProp.value != 'function') {
						dcl._error('wrong super value result', base, name, index, props);
					}
		            state.prop = null;
		        }
				if (!prop.value || isSuper(prop.value) && !prop.value.spr.around) {
					return; // skip descriptor: no actionable value
				}
		    }
		    if (state.prop) {
				if (newProp.get || newProp.set) {
					if (state.backlog.length) {
						state.backlog = [];
					}
				} else {
					state.backlog.push(convertToValue(state.prop));
				}
		    }
		    state.prop = newProp;
	    });
		processBacklog(state, weaver);
	    return weaver.stop ? weaver.stop(state) : state.prop;
	}

	var dclUtils = {adaptValue: adaptValue, adaptGet: adaptGet,
			convertToValue: convertToValue, cloneDescriptor: cloneDescriptor,
			augmentDescriptor: augmentDescriptor, augmentWritable: augmentWritable,
			replaceDescriptor: replaceDescriptor, replaceWritable: replaceWritable
		};

	function processBacklog (state, weaver) {
		if (state.backlog.length) {
			state.backlog.push(convertToValue(state.prop));
			state.prop = weaver.weave(state.backlog, dclUtils);
			state.backlog = [];
		}
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


	// dcl helpers

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

	function makeStub (aroundStub, beforeChain, afterChain) {
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


	// MODULE: weavers

	function weaveAround (chain, utils) {
		var newProp = utils.cloneDescriptor(chain[chain.length - 1]);

		if (newProp.get || newProp.set) {
			// convert to value
			newProp.value = utils.adaptGet(newProp.get);
			delete newProp.get;
			delete newProp.set;
		}

		return newProp;
	}

	function weaveChain (chain, utils) {
		if (this.reverse) {
			chain.reverse();
		}

		var newProp = utils.cloneDescriptor(chain[chain.length - 1]);

		// extract functions
		chain = chain.map(function (prop) {
			return prop.get || prop.set ? utils.adaptGet(prop.get) : prop.value;
		});

		newProp.value = function () {
			for (var i = 0; i < chain.length; ++i) {
				chain[i].apply(this, arguments);
			}
		};

		return newProp;
	}


	// MODULE: dcl (the main function)

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
				bases = c3mro(superClass, props).reverse();
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
						dcl.chainWith(faux, name, dcl.weaveSuper);
					}
				} else {
					if (isSuper(prop.value)) {
						dcl.chainWith(faux, name, dcl.weaveSuper);
					}
				}
			}
		});

		// collect simple props, and a list of special props
		var finalProps = {}, finalSpecial = populateProps(finalProps, mixins, special);
		if (!finalSpecial.hasOwnProperty(cname)) {
			finalSpecial[cname] = special.hasOwnProperty(cname) ? special[cname] : dcl.weaveAfter;
		}

		// process special props
		Object.keys(finalSpecial).forEach(function (name) {
			var prop = weaveProp(name, bases, finalSpecial[name], props);
			if (!prop) {
				prop = {configurable: true, enumerable: false, writable: true, value: function nop () {}};
			}
			var	newProp = cloneDescriptor(prop), advices;
			if (prop.get || prop.set) {
				// accessor descriptor
				advices = getAccessorSideAdvices(name, bases, 'get');
				newProp.get = dcl._makeStub(prop.get, advices.before, advices.after);
				advices = getAccessorSideAdvices(name, bases, 'set');
				newProp.set = dcl._makeStub(prop.set, advices.before, advices.after);
			} else {
				// data descriptor
				advices = getDataSideAdvices(name, bases);
				var stub = dcl._makeStub(prop.value, advices.before, advices.after);
				advices = getAccessorSideAdvices(name, bases, 'set');
				stub.advices.set = advices;
				newProp.value = stub;
			}
			finalProps[name] = newProp;
		});

		return dcl._makeCtr(baseClass, finalProps, faux[mname]);
	}


	// build export

	// guts, do not use them!

	dcl._error = function (msg) {
		throw new Error(msg);
	};
	dcl._makeSuper = makeSuper;
	dcl._makeCtr   = makeCtr;
	dcl._makeStub  = makeStub;

	// utilities

	dcl.populatePropsNative = populatePropsNative;
	dcl.getPropertyDescriptor = getPropertyDescriptor;

	// meta

	dcl.Prop = function Prop (x) { this.x = x; };
	dcl.prop = function prop(x) { return new dcl.Prop(x); };

	dcl.isInstanceOf = function isInstanceOf (o, ctr) {
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
	};

	// chains

	function chainWith (ctr, name, weaver) {
		if (ctr && ctr[mname]) {
			var special = ctr[mname].special;
			if (special.hasOwnProperty(name)) {
				var own = special[name];
				if (own === weaver || own.name === weaver.name || weaver.name === 'super') {
					return true;
				}
				if (own.name !== 'super') {
					dcl._error('different weavers: ' + name, ctr, name, weaver, own);
				}
			}
			special[name] = weaver;
			return true;
		}
		return false;
	}

	dcl.weaveBefore = {name: 'before', weave: weaveChain, reverse: true};
	dcl.weaveAfter  = {name: 'after',  weave: weaveChain};
	dcl.weaveSuper  = {name: 'super',  weave: weaveAround};

	dcl.chainWith   = chainWith;
	dcl.chainBefore = function (ctr, name) { return dcl.chainWith(ctr, name, dcl.weaveBefore); };
	dcl.chainAfter  = function (ctr, name) { return dcl.chainWith(ctr, name, dcl.weaveAfter); };

	// super & AOP

	function makeSuper (advice, S) {
		var f = function superNop () {};
		f.spr = new S(advice);
		return f;
	}

	function isSuper (f) { return f && f.spr instanceof dcl.Super; }

	dcl.Super   = function Super (f) { this.around = f; };
	dcl.isSuper = isSuper;
	dcl.Super[pname].declaredClass = 'dcl.Super';

	dcl.Advice  = dcl(dcl.Super, {
		declaredClass: 'dcl.Advice',
		constructor: function () {
			this.before = this.around.before;
			this.after  = this.around.after;
			this.around = this.around.around;
		}
	});

	dcl.advise = function (advice) { return dcl._makeSuper(advice, dcl.Advice); };

	dcl.superCall = dcl.around = function (f) { return dcl._makeSuper(f, dcl.Super); };
	dcl.before = function (f) { return dcl.advise({before: f}); };
	dcl.after  = function (f) { return dcl.advise({after:  f}); };

	// export

	return dcl;
});
