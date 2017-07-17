import m0 from "../dcl";import m1 from "../advise";export default (function(_,f){return f(m0,m1);})
(['../dcl', '../advise'], function (dcl, advise) {
	'use strict';

	var registry = {};

	// register all named classes automatically
	advise.after(dcl, '_makeCtr', function (_, result) {
		if (result && typeof result.prototype.declaredClass == 'string') {
			registry[result.prototype.declaredClass] = result;
		}
	});

	return {
		get: function (name) { return registry[name]; },
		has: function (name) { return Object.prototype.hasOwnProperty.call(registry, name); },
		delete: function (name) { return delete registry[name]; },
		keys: function () {
			return Object.keys(registry).filter(function (name) {
				return Object.prototype.hasOwnProperty.call(registry, name);
			});
		},
		clear: function () { registry = {}; }
	};
});
