/* UMD.define */ (typeof define=="function"&&define||function(d,f,m){m={module:module,require:require};module.exports=f.apply(null,d.map(function(n){return m[n]||require(n)}))})
(['../dcl'], function (dcl) {
	'use strict';

	var Destroyable = dcl(null, {declaredClass: 'dcl/mixins/Destroyable'});
	dcl.chainBefore(Destroyable, 'destroy');

	return Destroyable;
});
