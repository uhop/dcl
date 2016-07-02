/* UMD.define */ (typeof define=="function"&&define||function(d,f,m){m={module:module,require:require};module.exports=f.apply(null,d.map(function(n){return m[n]||require(n)}))})
(['../dcl'], function (dcl) {
	'use strict';

	// TODO: implement mix

	return dcl(null, {
		declaredClass: 'dcl/bases/Mixer',
		constructor: function (x) {
			dcl.mix(this, x);
		}
	});
});
