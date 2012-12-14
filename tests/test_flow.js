var dcl     = require("dcl");
var advise  = require("dcl/advise");
var flow    = require("dcl/advices/flow");

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

// our advised version:
var AdvisedAckermann = dcl(Ackermann, {
  declaredName: "AdvisedAckermann",
  m0: dcl.advise(flow.advice("m0")),
  n0: dcl.advise(flow.advice("n0")),
  a:  dcl.advise(flow.advice("a")),
});

// our instrumented version:
var InstrumentedAckermann = dcl(
  [Ackermann, AdvisedAckermann],
  {
    m0: dcl.around(function(sup){
      return function(n){
        console.log("m0 - a() was called: " + (flow.inFlowOf("a") || 0));
        console.log("m0 - n0() was called: " + (flow.inFlowOf("n0") || 0));
        var stack = flow.getStack();
        var previous = stack[stack.length - 2] || "(none)";
        console.log("m0 - called directly from: " + previous);
        return sup.call(this, n);
      }
    })
  }
);

var x = new InstrumentedAckermann();
x.a(1, 1);
