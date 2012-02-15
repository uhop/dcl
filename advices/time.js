(function(define){
	"use strict";
	define(["../dcl", "../advise"], function(dcl, advise){
		var uniq = 0;
		return function(name){
			var inCall = 0, label = "UniqueTimer (" + name + ") #" + uniq++;
			return new dcl.Advice({
				before: function(){
					if(!(inCall++)){
						console.time(label);
					}
				},
				after: function(){
					if(!--inCall){
						console.timeEnd(label);
					}
				}
			});
		};
	});
})(typeof define != "undefined" ? define : function(_, f){
	if(typeof module != "undefined"){
		module.exports = f(require("../dcl"), require("../advise"));
	}else{
		if(typeof advise != "undefined"){
			time = f(dcl, advise);  // describing a global
		}else{
			throw Error("Include dcl.js and advise.js before advices/time.js");
		}
	}
});
