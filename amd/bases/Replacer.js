define
(['../dcl'], function (dcl) {
	'use strict';

	return dcl({
		declaredClass: 'dcl/bases/Replacer',
		constructor: function (x) {
			var props = dcl.collectPropertyDescriptors({}, x);
			Object.keys(props).forEach(function (name) {
				if (name in this) {
					Object.defineProperty(this, name, props[name]);
				}
			}, this);
		}
	});
});
