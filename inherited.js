(function(factory){
	if(typeof define != "undefined"){
		define(["./mini"], factory);
	}else if(typeof module != "undefined"){
		module.exports = factory(require("./mini"));
	}else{
		factory(dcl);
	}
})(function(dcl){
	var empty = {}, t;

	function inherited(ctor, name, args){
		var c = arguments.length < 3 && ctor.callee, // c is truthy if in non-strict mode.
			f = get.call(this, c ? c.ctr : ctor, c ? c.nom : name);
		if(f){ return f.apply(this, c ? ctor || name : args); }
		// intentionally no return
	}

	function get(ctor, name){
		var meta = this.constructor._m, bases, base, i, l;
		if(typeof meta.w[name] == "number" && meta.w[name] < 3){
			return; // return undefined
		}
		if(meta){
			if(meta.c.hasOwnProperty(name)){
				if((bases = meta.c[name])){	// intentional assignment
					for(i = bases.length - 1; i >= 0; --i){
						base = bases[i];
						if(base.ctr === ctor){
							return i > 0 ? bases[i - 1] : 0;
						}
					}
				}
				return; // return undefined
			}
			for(bases = meta.b, i = bases.length - 1; i >= 0; --i){
				if(bases[i] === ctor){
					break;
				}
			}
			if(i >= 0){	// intentional assignments
				for(++i, l = bases.length; i < l; ++i){
					if((meta = (base = bases[i])._m)){	// intentional assignment
						if((meta = meta.h).hasOwnProperty(name)){	// intentional assignment
							return meta[name];
						}
					}else{
						return base.prototype[name];
					}
				}
			}
		}
		return empty[name];
	}

	dcl._post(function(ctor){
		var bases = ctor._m.b, i = bases.length - 1, ctr, meta, name, f;
		for(; i >= 0; --i){
			ctr = bases[i];
			if((meta = ctr._m)){ // intentional assignment
				meta = meta.h;
				for(name in meta){
					f = meta[name];
					if(f instanceof Function){
						if(f.nom === name){ break; }
						f.ctr = ctr;
						f.nom = name;
					}
				}
			}
		}
		ctor.prototype.inherited = inherited;
	});

	inherited.get = get;
	return dcl.inherited = inherited;   // intentional assignment
});
