function Decorator(){}
Decorator.prototype = {knows: {}};

function AfterChain(){}
AfterChain.prototype = new Decorator;
AfterChain.prototype.name = "ChainAfter";
AfterChain.prototype.makeStub = function(bases, name){
    return function(){
        for(var i = bases.length - 1, f; i >= 0; --i){
            f = bases[i];
            f = f._meta ? f._meta.hidden : f.prototype;
            if(f){ f.apply(this, arguments); }
        }
    };
};

function Super(f){ this.f = f; }
Super.prototype = new Decorator;
Super.prototype.name = "Super";
Super.prototype.makeStub = function(bases, name){
    var meta, i = bases.length - 1, h, f, p = null;
    for(; i >= 0; --i){
        meta = bases[i]._meta;
        if(meta){
            h = meta.hidden;
            if(h && h.hasOwnProperty(name)){
                f = h[name];
                p = f instanceof Super ? f.f(p) : (f || p);
            }
        }
    }
    meta = h = f = null;
    return p;
};
function superCall(f){ return new Super(f); }

// extras

function BeforeChain(){}
BeforeChain.prototype = new Decorator;
BeforeChain.prototype.name = "BeforeChain";
BeforeChain.prototype.makeStub = function(bases, name){
    return function(){
        for(var i = 0, l = bases.length, f; i < l; ++i){
            f = bases[i];
            f = f._meta ? f._meta.hidden : f.prototype;
            if(f){ f.apply(this, arguments); }
        }
    };
};

function Advice(a){ this.a = a; }
Advice.prototype = new Decorator;
Advice.prototype.name = "Advice";
Advice.prototype.knows = {Super: 1};
Advice.prototype.makeStub = function(bases, name){
    var meta, i = bases.length - 1, h, f, p = null;
    for(; i >= 0; --i){
        meta = bases[i]._meta;
        if(meta){
            h = meta.hidden;
            if(h && h.hasOwnProperty(name)){
                f = h[name];
                p = f instanceof Super ? f.f(p) : (f instanceof Advice && f.a.around ? f.a.around(p) : (f || p));
            }
        }
    }
    meta = h = f = null;
    return function(){
        var r, f, i = 0, l = bases.length;
        // 1) before chain
        for(; i < l; ++i){
            meta = bases[i]._meta;
            if(meta){
                h = meta.hidden;
                if(h && h.hasOwnProperty(name)){
                    f = h[name];
                    f = f instanceof Advice && f.a.before;
                    if(f){ f.apply(this, arguments); }
                }
            }
        }
        try{
            r = p.apply(this, arguments);
        }catch(e){
            r = e;
        }
        for(i = l - 1; i >= 0; --i){
            meta = bases[i]._meta;
            if(meta){
                h = meta.hidden;
                if(h && h.hasOwnProperty(name)){
                    f = h[name];
                    f = f instanceof Advice && f.a.after;
                    if(f){ f.call(this, r); }
                }
            }
        }
    };
};
function advice(a){ return new Super(a); }
