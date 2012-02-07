(function(define){
	"use strict";
	define(["./dcl"], function(dcl){
		dcl._AdviceNode.prototype.unadvise =
		dcl._AdviceNode.prototype.destroy = function(){
			var f = this.pf.f || null, t = this.nf, p = this.p;
			this.remove(this);
			for(; t !== p; f = t.f, t = t.nf){
				if(t.o){
					t.f = t.o(f);
				}
			}
		};

		function advise(instance, name, advice){
			var f = instance[name], a;
			if(f && f.adviceNode && f.adviceNode instanceof dcl._AdviceNode){
				a = f.adviceNode;
			}else{
				a = new dcl._AdviceNode;
				a.add(0, 0, 0, f);
				instance[name] = dcl._makeAOPStub(a);
			}
			return a.add(advice.before, advice.after, advice.around);
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
