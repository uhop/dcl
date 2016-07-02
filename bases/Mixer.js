/* UMD.define */ (typeof define=="function"&&define||function(d,f,m){m={module:module,require:require};module.exports=f.apply(null,d.map(function(n){return m[n]||require(n)}))})
(['../dcl'], function (dcl) {
	'use strict';

	return dcl(null, {
		declaredClass: 'dcl/bases/Mixer',
		constructor: function (x) {
			Object.defineProperties(this, dcl.populatePropsNative({}, x));
		}
	});
});
