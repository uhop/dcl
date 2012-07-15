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
	var lvl = 0;
	function rep(ch, n){
		if(n < 1){ return ""; }
		if(n == 1){ return ch; }
		var h = rep(Math.floor(n / 2));
		return h + h + ((n & 1) ? ch : "");

	}
	function pad(value, width, ch){
		var v = value.toString();
		return v + rep(ch || " ", width - v.length);
	}
	return function(name, level){
		return {
			before: function(){
				++lvl;
				console.log((level ? pad(lvl, 2 * lvl) : "") + this + " => " +
					name + "(" + Array.prototype.join.call(arguments, ", ") + ")");
			},
			after: function(r){
				console.log((level ? pad(lvl, 2 * lvl) : "") + this + " => " +
					name + (r && r instanceof Error ? " throws" : " returns") + " " + r);
				--lvl;
			}
		};
	};
});
