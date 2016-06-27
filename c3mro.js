module.exports = (function () {
	'use strict';
	// C3MRO implementation
	var M; // our map implementation if not defined
	if (typeof Map == 'undefined') {
		// our fake, inefficient, incomplete, yet totally correct Map
		M = function () {
			this.list = [];
			this.size = 0;
		};
		M.prototype = {
			has: function (key) { return this.get(key); },
			get: function (key) {
				for (var i = 0, n = this.list.length; i < n; i += 2) {
					if (key === this.list[i]) {
						return this.list[i + 1];
					}
				}
				// returns undefined if not found
			},
			set: function (key, value) {
				for (var i = 0, n = this.list.length; i < n; i += 2) {
					if (key === this.list[i]) {
						this.list[i + 1] = value;
						return this;
					}
				}
				this.list.push(key, value);
				++this.size;
				return this;
			}
		};
	} else {
		M = Map;
	}
	return function (bases) {
		// build a connectivity matrix
		var connectivity = new M();
		bases.forEach(function (base) {
			(base._meta ? base._meta.bases : [base]).forEach(function (base, index, array) {
				if (connectivity.has(base)) {
					var value = connectivity.get(base);
					++value.counter;
					if (index) {
						value.links.push(array[index - 1]);
					}
				} else {
					connectivity.set(base, {
						links:   index ? [array[index - 1]] : [],
						counter: index + 1 == array.length ? 0 : 1
					});
				}
			});
		});
		// Kahn's algorithm
		var output = [], unreferenced = [];
		// find unreferenced bases
		bases.forEach(function (base) {
			var last = base._meta ? base._meta.bases[base._meta.bases.length - 1] : base;
			if (!connectivity.get(last).counter) {
				unreferenced.push(last);
			}
		});
		while (unreferenced.length) {
			var base = unreferenced.pop();
			output.push(base);
			var value = connectivity.get(base);
			value.links.forEach(updateCounter);
		}
		// final checks and return
		if (connectivity.size != output.length) {
			throw Error('Graph has cycles.');
		}
		return output;

		function updateCounter (base) {
			var value = connectivity.get(base);
			if (!--value.counter) {
				unreferenced.push(base);
			}
		}
	};
})();
