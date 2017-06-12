// *Version 2.x*

// *This file is written using a literate JavaScript. You can download
// [this cheatsheet](/2.x/downloads/code/cheatsheet.js) to use as a local reference
// or to run it locally.*

// *If you prefer to see text as inline comments, just click on a sidebar
// handle at the far right.*

// *While `dcl` works great in browsers using an AMD loader or
// even simple `<script>`, this tutorial is assumed to be run with
// [node.js](http://nodejs.org).*

// For our examples we will need the main [dcl](/2.x/docs/dcl_js/) module:
var dcl = require("dcl");

// ## Declaring "classes"

// See [dcl()](/2.x/docs/dcl_js/dcl/).

// ### Simple "class" based on `Object`

var A = dcl({
  declaredClass: 'A',
  constructor: function (scale) {
    this.scale = scale;
  },
  calculate: function (x) {
    return this.scale * x;
  }
});

console.log(new A(2).calculate(1)); // 2

// ### Single inheritance

var B = dcl(A, {
  declaredClass: 'B',
  // Constructor of `A` will be called automatically.
  // It will deal with `scale` -- no need to touch it.
  constructor: function (scale, offset) {
    this.offset = offset;
  },
  calculate: function (x) {
    return this.scale * x + this.offset;
  }
});

console.log(new B(2, 1).calculate(1)); // 3

// ### Supercall

// See [dcl.superCall()](/2.x/docs/dcl_js/supercall).

// Let's repeat `B`, but with a supercall to modularize `calculate()`:

var B2 = dcl(A, {
  declaredClass: 'B2',
  constructor: function (scale, offset) {
    this.offset = offset;
  },
  // Don't forget the double function pattern for supercalls and around advices
  // explained in [Supercalls](/2.x/docs/general/supercalls/)!
  calculate: dcl.superCall(function (sup) {
    return function (x) {
      return sup.call(this, x) + this.offset;
    };
  })
});

console.log(new B2(2, 1).calculate(1)); // 3

// ### Mixins

// This time we'll restructure our `B` example.

var Linear = dcl({
  declaredClass: 'Linear',
  constructor: function (arg) {
    this.scale  = arg.scale  || 1;
    this.offset = arg.offset || 0;
  }
});

var Calculator = dcl(Linear, {
  declaredClass: 'Calculator',
  calculate: function (x) {
    return this.scale * x + this.offset;
  }
});

var ReverseCalculator = dcl(Linear, {
  declaredClass: 'ReverseCalculator',
  reverse: function (x) {
    return (x - this.offset) / this.scale;
  }
});

var LinearCalculator = dcl([
  Calculator, ReverseCalculator
]);

var l = new LinearCalculator({scale: 2, offset: 1});
console.log(l.calculate(1)); // 3
console.log(l.reverse(3));   // 1

// ### Introspection

// See [dcl.isInstanceOf()](/2.x/docs/dcl_js/isinstanceof).

console.log(l instanceof Linear);            // true
console.log(l instanceof Calculator);        // true
console.log(l instanceof ReverseCalculator); // false
console.log(l instanceof LinearCalculator);  // true

console.log(dcl.isInstanceOf(l, Linear));            // true
console.log(dcl.isInstanceOf(l, Calculator));        // true
console.log(dcl.isInstanceOf(l, ReverseCalculator)); // true
console.log(dcl.isInstanceOf(l, LinearCalculator));  // true

// ### AOP

// See [dcl.advise()](/2.x/docs/dcl_js/advise/),
// [dcl.before()](/2.x/docs/dcl_js/before/), and
// [dcl.after()](/2.x/docs/dcl_js/after/).

// Let's attach all possible advices:

var C = dcl({
  targetForBefore: function () {},
  targetForAfter:  function () {},
  targetForAll:    function () {}
});

var D = dcl(C, {
  targetForBefore: dcl.before(function (x) {
    console.log(x);
  }),
  targetForAfter: dcl.after(function (args, result) {
    console.log(result);
  }),
  targetForAll: dcl.advise({
    before: function (x) {
      console.log(x);
    },
    // Don't forget the double function pattern for supercalls and around advices
    // explained in [Supercalls](/2.x/docs/general/supercalls/)!
    around: function (sup) {
      return function (x) {
        return sup && sup.call(this, x) ? 1 : -1;
      };
    },
    after: function (args, result) {
      console.log(result);
    }
  })
});

var d = new D;
d.targetForBefore(1); // 1
d.targetForAfter(1);  // undefined
d.targetForAll(1);    // 1, -1

// To be continued&hellip;
