(function(define){
	"use strict";
	define(["../dcl", "../advise"], function(dcl, advise){
		var Counter = new dcl(null, {
			declaredClass: "dcl.advices.Counter",
			constructor: function(){
				this.reset();
			},
			reset: function(){
				this.calls = this.errors = 0;
			},
			advise: function(instance, name){
				var self = this;
				return advise(instance, name, {
					before: function(){
						++self.calls;
					},
					after: function(r){
						if(r instanceof Error){
							++self.errors;
						}
					}
				});
			}
		});

		return function(){ return new Counter; };
	});
})(typeof define != "undefined" ? define : function(_, f){
	if(typeof module != "undefined"){
		module.exports = f(require("../dcl"), require("../advise"));
	}else{
		if(typeof advise != "undefined"){
			counter = f(dcl, advise);  // describing a global
		}else{
			throw Error("Include dcl.js and advise.js before advices/counter.js");
		}
	}
});
