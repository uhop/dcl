(function(factory){
	if(typeof define != "undefined"){
		define(["../dcl", "./Destroyable"], factory);
	}else if(typeof module != "undefined"){
		module.exports = factory(require("../dcl"), require("./Destroyable"));
	}else{
		Cleanup = factory(dcl, Destroyable);
	}
})(function(dcl, Destroyable){
	"use strict";

	return dcl(Destroyable, {
		//declaredClass: "dcl/mixins/Cleanup",
		constructor: function(){
			this._cleanup_stack = [];
		},
		pushCleanup: function(resource, cleanup){
			var f = cleanup ? function(){ cleanup(resource); } : function(){ resource.destroy(); };
			this._cleanup_stack.push(f);
			return f;
		},
		popCleanup: function(dontRun){
			if(dontRun){
				return this._cleanup_stack.pop();
			}
			this._cleanup_stack.pop()();
		},
		removeCleanup: function(f){
			for(var i = this._cleanup_stack.length - 1; i >= 0; --i){
				if(this._cleanup_stack[i] === f){
					this._cleanup_stack.splice(i, 1);
					return true;
				}
			}
		},
		cleanup: function(){
			for(var i = this._cleanup_stack.length - 1; i >= 0; --i){
				this._cleanup_stack[i]();
			}
			this._cleanup_stack = [];
		},
		destroy: function(){
			this.cleanup();
		}
	});
});
