(function(define){
	define(["./dcl-mini"], function(dcl){
		var empty = {};
		
		function inherited(ctor, name, args){
			var c = arguments.length < 3 && ctor.callee, // c is truthy if in non-strict mode.
				f = get(c ? c.ctr : ctor, c ? c.nom : name, this);
			if(f){ return f.apply(this, c ? ctor || name : args); }
			// intentionally no return
		}
		
		function get(ctor, name, instance){
			var m = instance.constructor._meta, b, c, i, l;
			if(typeof m.chains[name] == "number"){
				throw Error(name + ": can't use inherited() on chained/advised methods");
			}
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

		dcl._set(0, 0, function(meta, proto){
			var b = meta.bases, i = b.length - 1, c, m, n, f;
			for(; i >= 0; --i){
				c = b[i];
				if((m = c._meta)){ // intentional assignment
					m = m.hidden;
					for(n in m){
						f = m[n];
						if(f instanceof Function){
							if(f.nom === n){ break }
							f.ctr = c;
							f.nom = n;
						}
					}
				}
			}
			proto.inherited = inherited;
		});
		
		inherited.get = get;
		return inherited;
	});
})(	typeof define != "undefined" ? define : function(_, f){
	if(typeof module != "undefined"){
		module.exports = f(require("./dcl-mini"));
	}else{
		if(typeof dcl != "undefined"){
			inherited = f(dcl);
		}else{
			throw Error("Include dcl-mini.js before dcl.js");
		}
	}
});
