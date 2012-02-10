(function(define){
	"use strict";
	define(["../advise"], function(advise){
		var uniq = 0;
		return function(instance, name, label){
			var inCall = 0;
			label = label || "UniqueTimer (" + name + ") #" + uniq++;
			return advise(instance, name, {
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
		module.exports = f(require("../advise"));
	}else{
		if(typeof advise != "undefined"){
			time = f(advise);  // describing a global
		}else{
			throw Error("Include advise.js before advices/time.js");
		}
	}
});
