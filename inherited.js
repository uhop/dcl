(function(factory){
	if(typeof define != "undefined"){
		define(["./dcl"], factory);
	}else if(typeof module != "undefined"){
		module.exports = factory(require("./dcl"));
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
			return 0;
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
				return 0;
			}
			if((i = (bases = meta.b).indexOf(ctor)) > 0){	// intentional assignments
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

	t = dcl._set()[1];

	dcl._set(0, function(meta, proto){
		t(meta, proto);
		var b = meta.b, i = b.length - 1, c, m, n, f;
		for(; i >= 0; --i){
			c = b[i];
			if((m = c._m)){ // intentional assignment
				m = m.h;
				for(n in m){
					f = m[n];
					if(f instanceof Function){
						if(f.nom === n){ break; }
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
