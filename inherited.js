(function(factory){
	if(typeof define != "undefined"){
		define(["./mini", "./advise"], factory);
	}else if(typeof module != "undefined"){
		module.exports = factory(require("./mini"), require("./advise"));
	}else{
		factory(dcl, advise);
	}
})(function(dcl, advise){
	var empty = {}, t;

	function inherited(ctor, name, args){
		var c = arguments.length < 3 && ctor.callee, // c is truthy if in non-strict mode.
			f = get.call(this, c ? c.ctr : ctor, c ? c.nom : name);
		if(f){ return f.apply(this, c ? ctor || name : args); }
		// intentionally no return
	}

	function get(ctor, name){
		var meta = this.constructor._m, bases, base, i, l;
		if(+meta.w[name]){
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
			if(i >= 0){
				for(++i, l = bases.length; i < l; ++i){
					if((meta = (base = bases[i])._m)){	// intentional assignments
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

	advise.after(dcl, "_p", function(args, ctor){
		// decorate all methods with necessary nom/ctr variables
		var bases = ctor._m.b, i = bases.length - 1, base, meta, name, f;
		for(; i >= 0; --i){
			base = bases[i];
			if((meta = base._m)){ // intentional assignment
				meta = meta.h;
				for(name in meta){
					f = meta[name];
					if(typeof f == "function"){
						if(f.nom === name){ break; }
						f.nom = name;
						f.ctr = base;
					}
				}
			}
		}
		ctor.prototype.inherited = inherited;
		ctor.prototype.getInherited = get;
	});

	dcl.getInherited = inherited.get = get;
	return dcl.inherited = inherited;   // intentional assignment
});
