/* UMD.define */ (typeof define=="function"&&define||function(d,f,m){m={module:module,require:require};module.exports=f.apply(null,d.map(function(n){return m[n]||require(n)}))})
([], function () {
	'use strict';

	return {
		advice: function (name, keyMaker) {
			return keyMaker ?
				{
					around: function (sup) {
						return function () {
							var key = keyMaker(this, arguments), cache = this.__memoizerCache, dict;
							if (!cache) {
								cache = this.__memoizerCache = {};
							}
							if (cache.hasOwnProperty(name)) {
								dict = cache[name];
							} else {
								dict = cache[name] = {};
							}
							if (dict.hasOwnProperty(key)) {
								return dict[key];
							}
							return dict[key] = sup ? sup.apply(this, arguments) : void 0;
						};
					}
				} :
				{
					around: function (sup) {
						return function (first) {
							var cache = this.__memoizerCache, dict;
							if (!cache) {
								cache = this.__memoizerCache = {};
							}
							if (cache.hasOwnProperty(name)) {
								dict = cache[name];
							} else {
								dict = cache[name] = {};
							}
							if (dict.hasOwnProperty(first)) {
								return dict[first];
							}
							return dict[first] = sup ? sup.apply(this, arguments) : undefined;
						};
					}
				};
		},
		guard: function (name) {
			return {
				after: function () {
					var cache = this.__memoizerCache;
					if (cache && name) {
						delete cache[name];
					} else {
						this.__memoizerCache = {};
					}
				}
			};
		}
	};
});
