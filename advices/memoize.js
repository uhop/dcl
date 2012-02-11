(function(define){
	"use strict";
	define(["../dcl", "../advise"], function(dcl, advise){
		function mem1(name){
			return function(sup){
				return function(key){
					var t = this.__memoizerCache, r;
					t = t[name];
					if(!t){ t = t[name] = {}; }
					if(t.hasOwnProperty(key)){
						return t[key];
					}
					if(sup){ r = sup.apply(this, arguments); }
					return t[key] = r;
				}
			};
		}

		function memN(name, keyMaker){
			return function(sup){
				return function(){
					var t = this.__memoizerCache, r, key = keyMaker.apply(this, arguments);
					t = t[name];
					if(!t){ t = t[name] = {}; }
					if(t.hasOwnProperty(key)){
						return t[key];
					}
					if(sup){ r = sup.apply(this, arguments); }
					return t[key] = r;
				}
			};
		}

		function guard1(name){
			return function(){
				delete this.__memoizerCache[name];
			}
		}

		function guardAll(){
			this.__memoizerCache = {};
		}

		function memoize(instance, name, keyMaker){
			if(!instance.__memoizerCache){ instance.__memoizerCache = {}; }
			return advise(instance, name, {
				around: keyMaker ? memN(name, keyMaker) : mem1(name)
			});
		}

		memoize.guard = function(instance, name, guardedName){
			return advise(instance, name, {
				after: guardedName ? guard1(guardedName) : guardAll
			});
		};

		return memoize;
	});
})(typeof define != "undefined" ? define : function(_, f){
	if(typeof module != "undefined"){
		module.exports = f(require("../dcl"), require("../advise"));
	}else{
		if(typeof advise != "undefined"){
			memoize = f(dcl, advise);  // describing a global
		}else{
			throw Error("Include dcl.js and advise.js before advices/memoize.js");
		}
	}
});
