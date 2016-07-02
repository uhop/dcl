/* UMD.define */ (typeof define=="function"&&define||function(d,f,m){m={module:module,require:require};module.exports=f.apply(null,d.map(function(n){return m[n]||require(n)}))})
(['../dcl', './Destroyable'], function (dcl, Destroyable) {
	'use strict';

	return dcl(Destroyable, {
		declaredClass: 'dcl/mixins/Cleanup',
		constructor: function () {
			this.__cleanupStack = [];
		},
		pushCleanup: function (resource, cleanup) {
			var f = cleanup ? function () { cleanup(resource); } : function () { resource.destroy(); };
			this.__cleanupStack.push(f);
			return f;
		},
		popCleanup: function (dontRun) {
			if (dontRun) {
				return this.__cleanupStack.pop();
			}
			this.__cleanupStack.pop()();
		},
		removeCleanup: function (f) {
			for (var i = this.__cleanupStack.length - 1; i >= 0; --i) {
				if (this.__cleanupStack[i] === f) {
					this.__cleanupStack.splice(i, 1);
					return true;
				}
			}
		},
		cleanup: function () {
			while (this.__cleanupStack.length) {
				this.__cleanupStack.pop()();
			}
		},
		destroy: function () {
			this.cleanup();
		}
	});
});
