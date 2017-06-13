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
var dcl = require('dcl');

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
  declaredClass: 'C',
  targetForBefore: function () {},
  targetForAfter:  function () {},
  targetForAll:    function () {}
});

var D = dcl(C, {
  declaredClass: 'D',
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

// ### Chaining

// See [dcl.chainBefore()](/2.x/docs/dcl_js/before/) and
// [dcl.chainAfter()](/2.x/docs/dcl_js/after/).

var E = dcl({
  declaredClass: 'E',
  b: function (x) { console.log('Eb' + x); },
  a: function (x) { console.log('Ea' + x); }
});
dcl.chainBefore(E, 'b');
dcl.chainAfter (E, 'a');

var F = dcl({
  declaredClass: 'F',
  b: function (x) { console.log('Fb' + x); },
  a: function (x) { console.log('Fa' + x); }
});

var G = dcl([E, F], {
  declaredClass: 'G',
  b: function (x) { console.log('Gb' + x); },
  a: function (x) { console.log('Ga' + x); }
});

var g = new G;
g.b(1); // Gb1, Fb1, Eb1
g.a(2); // Ea2, Fa2, Ga2

// ### Property descriptors

// See [dcl.prop()](/2.x/docs/dcl_js/prop/).

// Define a read-only property:

var H = dcl({
  declaredClass: 'H',
  m1: function () {},
  m2: dcl.prop({
    value: function () {},
    writable: false
  })
});

console.log(
  Object.getOwnPropertyDescriptor(
    H.prototype, 'm1').writable); // true
console.log(
  Object.getOwnPropertyDescriptor(
    H.prototype, 'm2').writable); // false

// Detect property descriptors:

var I = dcl({
  declaredClass: 'I',
  m1: function () {},
  m2: {
    value: function () {},
    writable: false
  }
}, {detectProps: true});

console.log(
  Object.getOwnPropertyDescriptor(
    I.prototype, 'm1').writable); // true
console.log(
  Object.getOwnPropertyDescriptor(
    I.prototype, 'm2').writable); // false

// Define all "class" properties with property descriptors:

var J = dcl(dcl.prop({
  declaredClass: {
    value: 'J'
  },
  m1: {
    value: function () {},
    writable: true
  },
  m2: {
    value: function () {},
    writable: false
  }
}));

console.log(
  Object.getOwnPropertyDescriptor(
    J.prototype, 'm1').writable); // true
console.log(
  Object.getOwnPropertyDescriptor(
    J.prototype, 'm2').writable); // false

// Set defaults for "classic" properties:

var K = dcl({
  declaredClass: 'K',
  m1: function () {}
}, {writable: false});

console.log(
  Object.getOwnPropertyDescriptor(
    K.prototype, 'm1').writable); // false

// Advise properties:

var L = dcl(dcl.prop({
  declaredClass: {
    value: 'L'
  },
  m: {
    get: dcl.superCall(function (sup) {
      return function () {
        return sup ? sup.call(this) : null;
      };
    })
  },
  p: {
    get: dcl.advise({
      before: function () { console.log('getting p'); },
      around: function (sup) {
        return function () {
          return sup ? sup.apply(this, arguments) : null;
        }
      }
    })
  }
}));

// ## AOP for objects

// For our examples we will need [advise](/2.x/docs/advise_js/) module:
var advise = require('dcl/advise');

// See [advise()](/2.x/docs/advise_js/advise/),
// [advise.before()](/2.x/docs/advise_js/before/),
// [advise.around()](/2.x/docs/advise_js/around/), and
// [advise.after()](/2.x/docs/advise_js/after/).

// Let's attach all possible advices:

var m = {
  targetForBefore: function () {},
  targetForAround: function () {},
  targetForAfter:  function () {},
  targetForAll:    function () {}
};

advise.before(m, 'targetForBefore', function (x) {
  console.log(x);
});

// Don't forget the double function pattern for supercalls and around advices
// explained in [Supercalls](/2.x/docs/general/supercalls/)!
advise.around(m, 'targetForAround', function (sup) {
  return function (x) {
    var result = sup && sup.call(this, x) ? 1 : -1;
    console.log(result);
    return result;
  };
});

advise.after(m, 'targetForAfter', function (args, result) {
  console.log(result);
});

advise(m, 'targetForAll', {
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
});

m.targetForBefore(1); // 1
m.targetForAround(1); // -1
m.targetForAfter(1);  // undefined
m.targetForAll(1);    // 1, -1

// ## Debugging helpers

// For our examples we will need [debug](/2.x/docs/debug_js/) module.
// We don't store its value, because it augments and returns `dcl`.
require('dcl/debug');

// See [dcl.log()](/2.x/docs/debug_js/log/).

// Inspect an object:
dcl.log(m);
; // *** class does not have meta information compatible with dcl
; //     targetForBefore: object-level advice (before 1, after 0)
; //     targetForAround: object-level advice (before 0, after 0)
; //     targetForAfter: object-level advice (before 0, after 1)
; //     targetForAll: object-level advice (before 1, after 1)

// Inspect a constructor:
dcl.log(L);
; // *** class L depends on 0 classes
; // *** class L has 3 weavers:
; //     constructor: after, m: super, p: super

// Inspect an instance:
dcl.log(g);
; // *** object of class G
; // *** class G depends on 2 classes: E, F
; // *** class G has 3 weavers:
; //     constructor: after, b: before, a: after
; //     b: class-level advice (before 0, after 0)
; //     a: class-level advice (before 0, after 0)
