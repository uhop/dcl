/* UMD.define */ (typeof define=="function"&&define||function(d,f,m){m={module:module,require:require};module.exports=f.apply(null,d.map(function(n){return m[n]||require(n)}))})
([], function () {
	'use strict';

	var flowStack = [], flowCount = {};

	return {
		advice: function (name) {
			return {
				before: function () {
					flowStack.push(name);
					if (flowCount[name]) {
						++flowCount[name];
					} else {
						flowCount[name] = 1;
					}
				},
				after: function () {
					--flowCount[name];
					flowStack.pop();
				}
			};
		},
		inFlowOf: function (name) {
			return flowCount[name];
		},
		getStack: function () {
			return flowStack;
		},
		getCount: function () {
			return flowCount;
		}
	};
});
