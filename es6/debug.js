import m0 from "./dcl";import m1 from "./advise";export default ((_,f)=>f(m0,m1))
(['./dcl', './advise'], function (dcl, advise) {
	'use strict';

	// set up custom names
	var mname = '_meta', pname = 'prototype', cname = 'constructor';

	function DclError (message) {
		this.name = 'DclError';
		this.message = message || 'Default Message';
		this.stack = (new Error()).stack;
	}
	DclError.prototype = Object.create(Error.prototype);
	DclError.prototype.constructor = DclError;

	var CycleError = dcl(DclError, {declaredClass: "dcl/debug/CycleError"}),
		ChainingError = dcl(DclError, {declaredClass: "dcl/debug/ChainingError"}),
		SuperError = dcl(DclError, {declaredClass: "dcl/debug/SuperError"});

	advise.around(dcl, '_error', function (sup) {
		return function (reason) {
			var name, ctr, method, props;
			if (reason === 'cycle') {
				var bases = arguments[1],
					names = bases.map(function (base, index) {
						return base[pname].declaredClass || ('UNNAMED_' + index);
					});
				props = arguments[2];
				name = props.declaredClass && props.declaredClass.value;
				if (!name || typeof name != 'string') {
					name = 'UNNAMED';
				}
				throw new CycleError('dcl: base class cycle in ' + name +
					', bases (' + names.join(', ') + ') are mutually dependent');
			}
			if (/^different weavers\b/.test(reason)) {
				var weaver = arguments[3], own = arguments[4];
				ctr = arguments[1];
				method = arguments[2];
				name = ctr[mname].props.declaredClass && ctr[mname].props.declaredClass.value || 'UNNAMED';
				throw new ChainingError('dcl: conflicting chain directives in ' +
					name + ' for ' + method + ', was ' + own.name + ', set to ' + weaver.name);
			}
			if (/^wrong super\b/.test(reason)) {
				var index = arguments[3];
				ctr = arguments[1];
				method = arguments[2];
				props = arguments[4];
				name = props.declaredClass && props.declaredClass.value;
				if (!name || typeof name != 'string') {
					name = 'UNNAMED';
				}
				var re = /^wrong super (\w+) (\w+)$/.exec(reason),
					baseName = ctr[mname].props.declaredClass &&
						ctr[mname].props.declaredClass.value ||
						('UNNAMED_' + index);
				throw new SuperError('dcl: super call error in ' +
					name + ', while weaving ' + baseName + ', method ' + method +
					' (' + re[1] + ') wrong ' + re[2]);
			}
			return sup.apply(this, arguments);
		};
	});

	advise.around(advise, '_error', function (sup) {
		return function (reason, instance, method, type) {
			var re = /^wrong super (\w+)$/.exec(reason);
			if (re) {
				var baseName = instance.declaredClass;
				if (!baseName || typeof baseName != 'string') {
					baseName = 'UNNAMED';
				}
				throw new SuperError('dcl: super call error in object of ' +
					baseName + ', while weaving method ' + method +
					' (' + type + ') wrong ' + re[1]);
			}
			return sup.apply(this, arguments);
		};
	});

	function logCtor (ctor) {
		var meta = ctor[mname];
		if (!meta) {
			console.log('*** class does not have meta information compatible with dcl');
			return;
		}
		var names = meta.bases.map(function (base, index) {
			return base[pname].declaredClass || ('UNNAMED_' + index);
		});
		console.log('*** class ' + names[names.length - 1] + ' depends on ' +
			(names.length - 1) + (names.length == 2 ? ' class' : ' classes') +
			(names.length > 1 ? ': ' + names.slice(0, -1).join(', ') : '')
		);
		var specialKeys = Object.keys(meta.special);
		if (specialKeys.length) {
			console.log('*** class ' + names[names.length - 1] + ' has ' +
				specialKeys.length + (specialKeys.length == 1 ? ' weaver: ' : ' weavers: ') +
				specialKeys.map(function (name) {
					return name + ': ' + meta.special[name].name;
				}).join(', ')
			);
		}
	}

	function logAdvices (advices) {
		return 'class-level advice (before ' + advices.before.length +
			', after ' + advices.after.length + ')';
	}

	function countAdvices (root, chain) {
		var total = 0;
		for (var node = root[chain]; node && node !== root; node = node[chain], ++total);
		return total;
	}

	function logNode (node) {
		return 'object-level advice (before ' + countAdvices(node, 'next_before') +
		 	', after ' + countAdvices(node, 'next_after') + ')';
	}

	function log (o, suppressCtor) {
		if (typeof o == 'function') {
			logCtor(o);
		} else if (o && typeof o == 'object') {
			var base = o[cname];
			if (base[pname].declaredClass) {
				console.log('*** object of class ' + base[pname].declaredClass);
			}
			if (!suppressCtor) {
				logCtor(base);
			}
			allKeys(o).forEach(function (name) {
				var prop = dcl.getPropertyDescriptor(o, name);
				if (prop.get || prop.set) {
					if (prop.get) {
						if (prop.get.node instanceof advise.Node) {
							console.log('    ' + name + ': getter with ' + logNode(prop.get.node));
						} else if (typeof prop.get.advices == 'object') {
							console.log('    ' + name + ': getter with ' + logAdvices(prop.get.advices));
						}
					}
					if (prop.set) {
						if (prop.set.node instanceof advise.Node) {
							console.log('    ' + name + ': setter with ' + logNode(prop.set.node));
						} else if (typeof prop.set.advices == 'object') {
							console.log('    ' + name + ': setter with ' + logAdvices(prop.set.advices));
						}
					}
				} else {
					if (prop.value.node instanceof advise.Node) {
						console.log('    ' + name + ': ' + logNode(prop.value.node));
					} else if (typeof prop.value.advices == 'object') {
						console.log('    ' + name + ': ' + logAdvices(prop.value.advices));
					}
				}
			});
		}
	}

	dcl.log = log;
	dcl.DclError = DclError;
	dcl.CycleError = CycleError;
	dcl.ChainingError = ChainingError;
	dcl.SuperError = SuperError;

	return dcl;

	function allKeys (o) {
		var keys = [];
		for (var key in o) {
			keys.push(key);
		}
		return keys;
	}
});
