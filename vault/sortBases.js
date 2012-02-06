function sortBases(bases){
    var m = {}, o = {}, r = [], b = [], i = bases.length - 1, base, proto, b2, j, l, name;
    for(; i >= 0; --i){
        base = bases[i];
        // add declaredClass
        proto = base.prototype;
        if(!proto.declaredClass){
            proto.declaredClass = uniqPrefix + counter++;
        }
        // build a connection map and the base list
        if(base._meta){
            for(b2 = base._meta.bases, j = 0, l = b2.length - 1; j < l; ++j){
                name = b2[j].prototype.declaredClass;
                if(!m[name]){
                    m[name] = [];
                }
                m[name].push(b2[j + 1]);
            }
            b = b.concat(b2);
        }else{
            b.push(base);
        }
    }

    // build output
    while(b.length){
        base = b.pop();
        name = base.prototype.declaredClass;
        if(!o[name]){
            if(m[name]){
                b.push(base);
                b = b.concat(m[name]);
                m[name] = 0;
            }else{
                o[name] = 1;
                r.push(base);
            }
        }
    }

    // calculate a base class
    base = bases[0];
    r.push(base ? base._meta && base === r[base._meta.bases.length - 1] ? base._meta.bases.length : 1 : 0);

    return r.reverse();
}
