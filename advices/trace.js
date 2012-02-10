(function(define){
	"use strict";
	define(["../advise"], function(advise){
		return function(instance, name){
			return advise(instance, name, {
				before: function(){
					console.log(this, " => " + name + "(" + Array.prototype.join.call(arguments, ", ") + ")");
				},
				after: function(r){
					console.log(this, " => " + name + (r && r instanceof Error ? " throws" : " returns") + " " + r);
				}
			});
		};
	});
})(typeof define != "undefined" ? define : function(_, f){
	if(typeof module != "undefined"){
		module.exports = f(require("../advise"));
	}else{
		if(typeof advise != "undefined"){
			trace = f(advise);  // describing a global
		}else{
			throw Error("Include advise.js before advices/trace.js");
		}
	}
});
