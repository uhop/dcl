(function(define){
	"use strict";
	define(["./dcl"], function(dcl){
		function advise(instance, name, advice){
			var f = instance[name], a;
			if(f && f.adviceNode && f.adviceNode instanceof dcl._AdviceNode){
				a = f.adviceNode;
			}else{
				a = new dcl._AdviceNode;
				a.add({around: f});
				instance[name] = dcl._makeAOPStub(a);
			}
			return a.add(advice);
		}

		return {advise: advise};
	});
})(typeof define != "undefined" ? define : function(_, f){
	if(typeof module != "undefined"){
		module.exports = f(require("./dcl"));
	}else{
		if(typeof dcl != "undefined"){
			aop = f(dcl);  // describing a global
		}else{
			throw Error("Include dcl-mini.js and dcl.js before aop.js");
		}
	}
});
