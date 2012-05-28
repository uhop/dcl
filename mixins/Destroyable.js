(function(factory){
	if(typeof define != "undefined"){
		define(["../dcl"], factory);
	}else if(typeof module != "undefined"){
		module.exports = factory(require("../dcl"));
	}else{
		Destroyable = factory(dcl);
	}
})(function(dcl){
	"use strict";

	return dcl(null, {
		//declaredClass: "dcl/mixins/Destroyable",
		destroy: dcl.chainBefore(function(){})
	});
});