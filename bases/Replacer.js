/* UMD.define */ (typeof define=="function"&&define||function(d,f,m){m={module:module,require:require};module.exports=f.apply(null,d.map(function(n){return m[n]||require(n)}))})
(['../dcl'], function (dcl) {
	'use strict';

	// TODO: implement allKeys()

	return dcl(null, {
		declaredClass: 'dcl/bases/Replacer',
		constructor: function (x) {
			var empty = {};
			dcl.allKeys(x).forEach(function (name) {
				if (name in this) {
					var t = x[name], e = empty[name];
					if (t !== e) {
						this[name] = t;
					}
				}
			}, this);
		}
	});
});
