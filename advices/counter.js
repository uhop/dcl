/* UMD.define */ (typeof define=="function"&&define||function(d,f,m){m={module:module,require:require};module.exports=f.apply(null,d.map(function(n){return m[n]||require(n)}))})
(['../dcl'], function (dcl) {
	'use strict';

	var Counter = new dcl({
		declaredClass: 'dcl/advices/counter/Counter',
		constructor: function () {
			this.reset();
		},
		reset: function () {
			this.calls = this.errors = 0;
		},
		advice: function () {
			var self = this;
			return {
				before: function () {
					++self.calls;
				},
				after: function (args, result) {
					if (result instanceof Error) {
						++self.errors;
					}
				}
			};
		}
	});

	return function(){ return new Counter; };
});
