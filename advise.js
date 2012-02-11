(function(define){
	"use strict";
	define(["./dcl"], function(dcl){

		var Node = dcl(null, {
			//declaredClass: "dcl.Node",
			constructor: function(){
				this.nb = this.pb = this.na = this.pa = this.nf = this.pf = this;
			},
			a: function(b, a, f, o){
				var t = new Node;
				t.p = this;
				t.b = b;
				this._a("b", t);
				t.a = a;
				this._a("a", t);
				t.f = f;
				this._a("f", t, o);
				t.o = o;
				if(o){ t.f = o(t.pf.f); }
				return t;
			},
			_a: function(topic, node, flag){
				if(node[topic] || flag){
					var n = "n" + topic, p = "p" + topic;
					(node[p] = this[p])[n] = (node[n] = this)[p] = node;
				}
			},
			r: function(node){
				this._r("b", node);
				this._r("a", node);
				this._r("f", node);
			},
			_r: function(topic, node){
				var n = "n" + topic, p = "p" + topic;
				node[n][p] = node[p];
				node[p][n] = node[n];
			},
			destroy: function(){
				var f = this.pf.f, t = this.nf, p = this.p;
				this.r(this);
				if(t !== this){
					for(; t !== p; f = t.f, t = t.nf){
						if(t.o){
							t.f = t.o(f);
						}
					}
				}
			}
		});
		Node.prototype.unadvise = Node.prototype.destroy;   // alias

		function makeAOPStub(a){
			var f = function(){
				var p, r;
				// running the before chain
				for(p = a.pb; p !== a; p = p.pb){
					p.b.apply(this, arguments);
				}
				// running the around chain
				try{
					if(a.pf !== a){ r = a.pf.f.apply(this, arguments); }
				}catch(e){
					r = e;
				}
				// running the after chain
				for(p = a.na; p !== a; p = p.na){
					p.a.call(this, r);
				}
				if(r instanceof Error){
					throw r;
				}
			};
			f.adviceNode = a;
			return f;
		}

		function advise(instance, name, advice){
			var f = instance[name], a;
			if(f && f.adviceNode && f.adviceNode instanceof Node){
				a = f.adviceNode;
			}else{
				a = new Node;
				if(f && f.advices){
					f = f.advices;
					a.a(f.b, f.a, f.f);
				}else{
					a.a(0, 0, f);
				}
				instance[name] = makeAOPStub(a);
			}
			if(advice instanceof Function){ advice = advice(name, instance); }
			return a.a(advice.before || advice.b, advice.after || advice.a, 0, advice.around || advice.f);
		}
		
		//advise.before = function(instance, name, f){ return advise(instance, name, {before: f}); };
		//advise.after  = function(instance, name, f){ return advise(instance, name, {after: f}); };
		
		return advise;
	});
})(typeof define != "undefined" ? define : function(_, f){
	if(typeof module != "undefined"){
		module.exports = f(require("./dcl"));
	}else{
		if(typeof dcl != "undefined"){
			advise = f(dcl);  // describing a global
		}else{
			throw Error("Include dcl-mini.js and dcl.js before advise.js");
		}
	}
});
