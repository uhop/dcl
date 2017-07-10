(function(_,f,g){g=window.dcl;g=g.bases||(g.bases={});g.Mixer=f(window.dcl);})
(['../dcl'], function (dcl) {
	'use strict';

	return dcl({
		declaredClass: 'dcl/bases/Mixer',
		constructor: function (x) {
			Object.defineProperties(this, dcl.collectPropertyDescriptors({}, x));
		}
	});
});
