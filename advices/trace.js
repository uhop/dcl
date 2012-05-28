(function(factory){
	if(typeof define != "undefined"){
		define([], factory);
	}else if(typeof module != "undefined"){
		module.exports = factory();
	}else{
		dcl_advices_trace = factory();
	}
})(function(){
	"use strict";

	return function(name){
		return {
			before: function(){
				console.log(this, " => " + name + "(" + Array.prototype.join.call(arguments, ", ") + ")");
			},
			after: function(r){
				console.log(this, " => " + name + (r && r instanceof Error ? " throws" : " returns") + " " + r);
			}
		};
	};
});
