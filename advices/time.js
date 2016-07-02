/* UMD.define */ (typeof define=="function"&&define||function(d,f,m){m={module:module,require:require};module.exports=f.apply(null,d.map(function(n){return m[n]||require(n)}))})
([], function () {
	'use strict';

	var uniq = 0;

	return function (name) {
		var inCall = 0, label = name || ('Timer #' + uniq++);
		return {
			before: function () {
				if (!(inCall++)) {
					console.time(label);
				}
			},
			after: function () {
				if (!--inCall) {
					console.timeEnd(label);
				}
			}
		};
	};
});
