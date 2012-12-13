// *This file is written using a literate JavaScript. You can download
// [this cheatsheet](/downloads/code/cheatsheet.js) to use as a local reference
// or to run it locally.*

// *While `dcl` works great in browsers using an AMD loader or
// even simple `<script>`, this tutorial is assumed to be run with
// [node.js](http://nodejs.org).*

// For our examples we will need the main `dcl` module:
var dcl = require("dcl");

// ## Declaring "classes".

// Declaring properties, constructors and methods:
var D = dcl(null, {
  declaredClass: "D",
  constructor: function(a, b, c){
    console.log("something");
  },
  method: function(x, y){
    return x + y;
  }
});

// No base class:
var A = dcl(null, {});

// Single inheritance:
var B = dcl(A, {});

// Mixins:
var M = dcl(null, {});
var C = dcl([B, M], {});

// Disposable one-off "class":
var x = new (dcl([B, M], {}))(1, 2, 3);

// ## Supercalls

// Make a super call passing through arguments:
var E = dcl(D, {
  method: dcl.superCall(function(sup){
    return function(x, y){
      if(sup){
        return sup.apply(this, arguments);
      }
      return 0;
    };
  })
});

// Make a super call with different arguments:
var F = dcl(D, {
  method: dcl.superCall(function(sup){
    return function(x, y){
      if(sup){
        return sup.call(this, x + 1, y - 1);
      }
      return 0;
    };
  })
});

// ## Class-level AOP

// Advise "before":
var H = dcl(D, {
  method: dcl.before(function(){
    console.log("Called with arguments: ", arguments);
  })
});

// Advise "after":
var I = dcl(D, {
  method: dcl.after(function(args, result){
    console.log("Returned result: ", result);
  })
});

// Advise "around":
var J = dcl(D, {
  method: dcl.around(function(sup){
    return function(x, y){
      console.log("Got: ", x, " and ", y);
      if(sup){
        try{
          var result = sup.call(this, x, y);
          console.log("Answered: ", result);
          return result;
        }catch(e){
          console.log("Exception: ", e);
          throw e;
        }
      }
    };
  })
});

// Full-blown advising:
var G = dcl(D, {
  method: dcl.advise({
    before: function(){
      console.log("Called with arguments: ", arguments);
    },
    after: function(args, result){
      console.log("Returned result: ", result);
    },
    around: function(sup){
      return function(x, y){
        console.log("Got: ", x, " and ", y);
        if(sup){
          try{
            var result = sup.call(this, x, y);
            console.log("Answered: ", result);
            return result;
          }catch(e){
            console.log("Exception: ", e);
            throw e;
          }
        }
      };
    }
  })
});

// ## Chaining

// Chain after:
dcl.chainAfter(D, "method1");

// Chain before:
dcl.chainBefore(D, "method2");

// Usually constructors are chained after, while destructors are chained before.
// `dcl` chains constructors automatically by default.

// ## Object-level AOP

// We need `advise` module:
var advise = require("dcl/advise");

var x = new J;

// Advise "before":
var a1 = advise.before(x, "method", function(){
  console.log("Called with arguments: ", arguments);
});

// Advise "after":
var a2 = advise.before(x, "method", function(args, result){
  console.log("Returned result: ", result);
});

// Advise "around":
var a3 = advise.around(x, "method", function(sup){
  return function(x, y){
    console.log("Got: ", x, " and ", y);
    if(sup){
      try{
        var result = sup.call(this, x, y);
        console.log("Answered: ", result);
        return result;
      }catch(e){
        console.log("Exception: ", e);
        throw e;
      }
    }
  };
});

// Full-blown advising:
var a4 = advise(x, "method", {
  before: function(){
    console.log("Called with arguments: ", arguments);
  },
  after: function(args, result){
    console.log("Returned result: ", result);
  },
  around: function(sup){
    return function(x, y){
      console.log("Got: ", x, " and ", y);
      if(sup){
        try{
          var result = sup.call(this, x, y);
          console.log("Answered: ", result);
          return result;
        }catch(e){
          console.log("Exception: ", e);
          throw e;
        }
      }
    };
  }
});

// Unadvise (in any order):
a2.unadvise();

// ## Inherited

// We need `inherited` module (its value is actually not used):
var inherited = require("dcl/inherited");

// Make a super call passing through arguments:
var K = dcl(D, {
  method: function(x, y){
    return this.inherited(arguments);
  }
});

// Make a super call with different arguments:
var L = dcl(D, {
  method: function(x, y){
    return this.inherited(arguments, [x + 1, y - 1]);
  }
});

// Make a super call (works in both strict and non-strict modes):
var M = dcl(D, {
  method: function(x, y){
    return this.inherited(M, "method", arguments);
  }
});

// Make a super call with `getInherited()` (works in both strict and non-strict modes):
var N = dcl(D, {
  method: function(x, y){
    var sup = this.getInherited(N, "method");
    if(sup){
      return sup.call(this, x + 1, y - 1);
    }
    return 0;
  }
});

// ## Debugging

// We need `debug` module (its inclusion adds enhanced error reporting automatically):
var dclDebug = require("dcl/debug");

var O = dcl(null, {
  declaredClass: "O"
});
var o = new O();

// Log a class:
dclDebug.log(O);

// Log an object:
dclDebug.log(o);
