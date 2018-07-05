define
(['../dcl'], function (dcl) {
	'use strict';

	return dcl({
		declaredClass: 'dcl/bases/Mixer',
		constructor: function (x) {
			Object.defineProperties(this, dcl.collectPropertyDescriptors({}, x));
		}
	});
});
