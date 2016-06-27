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

	function buildClass (bases, props) {
		return bases.reduce(function (proto, base, index) {
	    	return Object.create(proto, base[mname].props);
	  	}, {});
	}

	var empty = {};

	function Super () {}
	function isSuper (f) { return f && f.spr instanceof Super; }

	function chain(name, bases, prop) {
		var props = base[mname].props;
		return bases.reduce(function(chain, base) {
			if (!props.hasOwnProperty(name)) {
				return chain;
			}
			var method = props[name][prop];
			if (isSuper(method)) {
				var previous = stubChain(chain);
				return method(previous);
			}
			if (typeof method != 'function') {
				dcl._error('not a function');
			}
			if (typeof chain == 'function') {
				return [chain, method];
			}
			if (chain instanceof Array) {
				chain.push(method);
			}
			return method;
		}, empty[name]);
	}

	function stubChain(chain) {
		if (chain instanceof Array) {
			return function runChain() {
				for (var i = 0; i < chain.length; ++i) {
					chain[i].apply(this, arguments);
				}
			};
		}
		return typeof chain == 'function' ? chain : null;
	}

	function chainSuper(name, bases, prop) {
		var props = base[mname].props;
		return bases.reduce(function(previous, base) {
			if (!props.hasOwnProperty(name)) {
				return previous;
			}
			var method = props[name][prop];
			if (isSuper(method)) {
				return method(typeof previous == 'function' ? previous : null);
			}
			if (prop !== 'value' && props[name].hasOwnProperty('value')) {
				return null;
			}
			return typeof method == 'function' ? method : null;
		}, empty[name]);
	}

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
			Object.keys(x).forEach(function(key) {
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

	// collect chains

	function recordMethod (name, f, type, dict) {
	    var record = dict[name] = dict[name] | {},
	        array = record[type] = record[type] | [];
	    array.push(f);
	}

	function recordAdvice (name, advice, type, before, after) {
	    if (advice.before) {
	        recordMethod(name, advice.before, type, before);
	    }
	    if (advice.after) {
	        recordMethod(name, advice.after, type, after);
	    }
	}

	function recordProp (name, prop, before, around, after) {
	    var recorded;
	    if (prop.get || prop.set) {
	        if (isSuper(prop.get)) {
	            recordAdvice(name, prop.get.spr, 'get', before, after);
	            recorded = true;
	        }
	        if (isSuper(prop.set)) {
	            recordAdvice(name, prop.set.spr, 'set', before, after);
	            recorded = true;
	        }
	    } else {
	        if (isSuper(prop.value)) {
	            recordAdvice(name, prop.value.spr, 'value', before, after);
	            recorded = true;
	        }
	    }
	    return recorded;
	}

	function collectChains (bases, beforeChainNames, afterChainNames) {
	    var before = {}, after = {}, superNames = {};
	    bases.forEach(function (base) {
	        if (!base[mname]) {
	            return;
	        }
	        var props = base[mname].props;
	        Object.keys(props).forEach(function (name) {
	            var prop = props[name];
	            if (beforeChainNames[name] === 1) {
	                recordMethod(name, prop.value, 'chain', before);
	            } else if (afterChainNames[name] === 1) {
	                recordMethod(name, prop.value, 'chain', after);
	            }
	            if (recordProp(name, prop, before, after)) {
	                superNames[name] = prop;
	            }
	        });
	    });
	    return {before: before, after: after, superNames: superNames};
	}

	function mixNames (a, b) {
		Object.keys(b).forEach(function (name) {
			if (b[name] === 1) {
				a[name] = 1;
			}
		});
	}

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
		var bases = [], baseClass = superClass[0], mixins = [], index;
		if (superClass.length > 1) {
			bases = c3mro(superClasses);
			if (baseClass[mname]) {
				index = baseClass[mname].bases.length - 1;
				if (bases[index] === baseClass) {
					mixins = bases.slice(index + 1);
				} else {
					baseClass = null;
					mixins = bases.slice(0);
				}
			} else {
				mixins = bases.slice(1);
			}
		}

		// add a stand-in for our future constructor
		var faux = {};
		faux[mname] = {bases: bases, props: props};
		bases.push(faux);
		mixins.push(faux);

		// collect chains
		var beforeChain = {}, afterChain = {};
		bases.forEach(function (base) {
			if (base[mname]) {
				mixNames(beforeChain, base[mname].before);
				mixNames(afterChain,  base[mname].after);
			}
		});

		// build prototype
		var state = {
				proto: baseClass && baseClass[pname] || {},
				before: {},
				after:  {},
				weave:  {}
			};
		state = mixins.reduce(function (state, base) {
			var proto = Object.create(proto), props, keys;
			// set up props, collect before/after
			if (base[mname]) {
				props = base[mname].props;
				keys  = Object.keys(props);
				mixNames(state.before, base[mname].before);
				mixNames(state.after,  base[mname].after);
			} else {
				props = {};
				keys  = [];
				Object.keys(base[pname]).forEach(function (name) {
					props[name] = Object.getOwnPropertyDescriptor(base[pname], name);
					keys.push(name);
				});
			}
			// go over props and weave
			keys.forEach(function (name) {
				var descriptor = props[name];
				Object.defineProperty(proto, name, descriptor);
			});
			return state;
		}, state);

		// inspect properties
	}

	return dcl;
});
