var dcl     = require("dcl");
var advise  = require("dcl/advise");
var time    = require("dcl/advices/time");
var memoize = require("dcl/advices/memoize");

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

var x = new Ackermann();

advise(x, "a", time("x.a"));

x.a(3, 3);
x.a(3, 3);

var y = new Ackermann();

advise(y, "m0", memoize.advice("m0"));
advise(y, "n0", memoize.advice("n0"));
advise(y, "a",  memoize.advice("a", function(self, args){
  return args[0] + "-" + args[1];
}));

advise(y, "a", time("y.a"));

y.a(3, 3);
y.a(3, 3);

