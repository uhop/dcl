var dcl     = require("dcl");
var advise  = require("dcl/advise");
var time    = require("dcl/advices/time");

var Stack = dcl(null, {
  declaredClass: "Stack",
  constructor: function(){
    this.stack = [];
  },
  push: function(n){
    return this.stack.push(n);
  },
  pop: function(){
    return this.stack.pop();
  },
  sum: function(init){
    // expensive, yet frequently called method
    // it has a linear complexity on stack size
    var acc = init;
    for(var i = 0; i < this.stack.length; ++i){
      acc += this.stack[i];
    }
    return acc;
  }
});

var x = new Stack();

advise(x, "sum", time("sum"));

for(var i = 0; i < 1000000; ++i){
  x.push(i);
}

var n = x.sum(0);
