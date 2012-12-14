var dcl     = require("dcl");
var advise  = require("dcl/advise");
var trace    = require("dcl/advices/trace");

var Ackermann = dcl(null, {
  declaredName: "Ackermann",
  m0: function(n){
    return n + 1;
  },
  n0: function(m){
    return this.a(m - 1, 1);
  },
  a: function(m, n){
    if(m == 0){
      return this.m0(n);
    }
    if(n == 0){
      return this.n0(m);
    }
    return this.a(m - 1, this.a(m, n - 1));
  }
});

// our instance:
var x = new Ackermann();

advise(x, "m0", trace("m0", true));
advise(x, "n0", trace("n0", true));
advise(x, "a",  trace("a",  true));

x.a(1, 1);
