var dcl     = require("dcl");
var advise  = require("dcl/advise");
var counter = require("dcl/advices/counter");

// our "class":
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

var counterM0 = counter();
advise(x, "m0", counterM0.advice());

var counterN0 = counter();
advise(x, "n0", counterN0.advice());

var counterA = counter();
advise(x, "a", counterA.advice());

x.a(3, 2);

console.log("m0() was called " + counterM0.calls + " times with " + counterM0.errors + " errors");
console.log("n0() was called " + counterN0.calls + " times with " + counterN0.errors + " errors");
console.log("a() was called "  + counterA .calls + " times with " + counterA .errors + " errors");
