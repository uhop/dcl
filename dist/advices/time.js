(function(_,f,g){g=window;g=g.dcl||(g.dcl={});g=g.advices||(g.advices={});g.time=f();})
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
