(function(define){
	"use strict";
	define([], function(){
		var empty = {};
		
		function inherited(ctor, name, args){
			var f = get(ctor, name, this);
			if(f){ return f.apply(this, args); }
		}
		
		function get(ctor, name, instance){
			var m = instance.constructor._meta, b, c, i, l;
			if(m){
				if((i = (b = m.bases).indexOf(ctor)) > 0){	// intentional assignments
					for(++i, l = b.length; i < l; ++i){
						if((m = (c = b[i])._meta)){	// intentional assignment
							if((m = m.hidden).hasOwnProperty(name)){	// intentional assignment
								return m[name];
							}
						}else{
							return c.prototype[name];
						}
					}
				}
			}
			return empty[name];
		}
		
		inherited.get = get;
		return inherited;
	});
})(	typeof define != "undefined" ? define : function(_, f){
		if(typeof module != "undefined"){
			module.exports = f();
		}else{
			inherited = f();
		}
	});
