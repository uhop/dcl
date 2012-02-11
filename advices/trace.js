(function(define){
	"use strict";
	define(["../dcl", "../advise"], function(dcl, advise){
		return function(name){
			return new dcl.Advice({
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
		module.exports = f(require("../dcl"), require("../advise"));
	}else{
		if(typeof advise != "undefined"){
			trace = f(dcl, advise);  // describing a global
		}else{
			throw Error("Include dcl.js and advise.js before advices/trace.js");
		}
	}
});
