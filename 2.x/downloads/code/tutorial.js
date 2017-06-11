// *Version 2.x*

// *This file is written using a literate JavaScript. You can download
// [this tutorial](/2.x/downloads/code/tutorial.js) to use as a local reference
// or to run it locally.*

// *If you prefer to see text as inline comments, just click on a sidebar
// handle at the far right.*

// *While `dcl` works great in browsers using an AMD loader or
// even simple `<script>`, this tutorial is assumed to be run with
// [node.js](http://nodejs.org).*

// *Create a directory, copy this file there, install `dcl`:*
//
// ```
// npm install dcl@2
// ```
//
// *And run the tutorial:*
//
// ```
// node tutorial.js
// ```
//

// For our examples we will need the main [dcl](/2.x/docs/dcl_js/) module:
var dcl = require('dcl');

// ## Single inheritance and constructors and supercalls, Oh My!

// Let's define a simple "class" based on `Object`:
var A = dcl({
  // Name of class. It is optional, but highly recommended, because it will help while debugging your objects.
  declaredClass: 'A',
  // Constructor (read more on that in [Constructors](/2.x/docs/general/constructors/)):
  constructor: function (y) {
    this.y = y || 1;
  },
  // Our method to play with:
  m: function (x) { return this.y * x; }
});

var a = new A(2);
console.log(a.m(2)); // 4

// Now let's define a "class" based on `A`, which overrides `m()` and uses a supercall:

var B = dcl(A, {
  declaredClass: 'B',
  constructor: function (y, z) {
    // The constructor of `A` will be called automatically with the same signature.
    this.z = z || 0;
  },
  // Note that a supercall (and an around advice) always uses a double function pattern.
  // Read more on that in [Supercalls](/2.x/docs/general/supercalls/).
  m: dcl.superCall(function (sup) {
    return function (x) {
      return sup.call(this, x) + this.z;
    };
  })
});

// As you can see we call `sup()` unconditionally, because we know it is statically defined in `A`.
// In some cases (mixins) we should check, if `sup` is truthy before calling it.

var b = new B(2, 1);
console.log(b.m(2)); // 5

// ## Enter AOP

// We add before and after advices:

var C = dcl(B, {
  declaredClass: 'C',
  // We do not define a constructor for `C` here -- we inherit `B`'s constructor with the same signature.
  m: dcl.advise({
    // `before` uses the same signature as the advised method.
    before: function (x) {
      console.log(x);
    },
    // `after` always uses the predefined signature.
    after: function (args, result) {
      console.log(result);
    }
  })
});

var c = new C(3, 4);
console.log(c.m(2)); // prints: 2, 10, 10

// The first printed number (2) comes from the before advice, the second one (10) comes from the after advice,
// and the third one (10 again) is from our `console.log()` printing whatever was returned.

// Now let's add another supercall (an around advice), and add a result modification from an after advice.
// In reality you should think twice about doing that: an around advice is the more natural place for that.
// But we do it to demonstrate how it can be done.

var D = dcl(C, {
  declaredClass: 'D',
  m: dcl.advise({
    around: function (sup) {
      return function (x) {
        return sup.call(this, x + 1);
      };
    },
    after: function (args, result, makeReturn) {
      makeReturn(2 * args[0] + 1);
    }
  })
});

var d = new D(3, 4);
console.log(d.m(2)); // prints: 2, 13, 5

// If we re-define `m()` as a regular method, it should behave as a supercall that doesn't call its super.
// But existing before and after advices should still continue to function normally.

var E = dcl(D, {
  declaredClass: 'E',
  m: function (x) { return x; }
});

var e = new E(3, 4);
console.log(e.m(3)); // prints: 3, 3, 7

// ## Getters/setters

// Let's define a "class" with a "smart" method, which chooses between two methods dynamically:

var F = dcl({
  declaredClass: 'F',
  constructor: function (x) { this.x = x || 0; },
  tripple: function (x) { return x + x + x; },
  square:  function (x) { return x * x; },
  get fun() { return this.x % 2 ? this.tripple : this.square; }
});

console.log(new F(0).fun(2)); // 4
console.log(new F(1).fun(2)); // 6

// Now let's add a supercall, which modifies our methods a little by adding 1 to their results.

var G = dcl(F, {
  declaredClass: 'G',
  fun: dcl.prop({
    get: dcl.superCall(function (sup) {
      return function () {
        return function (x) {
          return sup.call(this).call(this, x) + 1;
        };
      };
    })
  })
});

// Obviously, we could add any type of advice there, and add other relevant 
// property descriptor values in [dcl.prop()](/2.x/docs/dcl_js/prop/).

console.log(new G(0).fun(2)); // 5
console.log(new G(1).fun(2)); // 7

// Our getter behaves just like a normal method. Can we add a normal supercall to it?
// Yes, we can -- `dcl` does it automatically:

var H = dcl(G, {
  declaredClass: 'H',
  fun: dcl.superCall(function (sup) {
    return function (x) {
      return sup.call(this, x) * 2;
    };
  })
});

console.log(new H(0).fun(2)); // 10
console.log(new H(1).fun(2)); // 14

// What about going back to getter? Sure thing -- it is automatic too:

var I = dcl(H, {
  declaredClass: 'I',
  fun: dcl.prop({
    get: dcl.superCall(function (sup) {
      return function () {
        return function (x) {
          return 1 / sup.call(this).call(this, x);
        };
      };
    })
  })
});

console.log(new I(0).fun(2)); // 0.1
console.log(new I(1).fun(2)); // 0.07142857142857142

// ## Property descriptors

// `dcl` can use property descriptors directly, it can generate them from
// a classic object definition, or can handle a mix of them intelligently.

// Classic definition:
var XC = dcl({
  m: function (x) { return x; },
  get p ()  { return this._v || 0; },
  set p (v) { this._v = v; },
  a: 1
});

var xc = new XC();
XC.prototype.a = 2;
xc.p = 1;
console.log(xc.p, xc.a); // 1 2

// Let's make `a` read-only:
var XR = dcl({
  m: function (x) { return x; },
  get p ()  { return this._v || 0; },
  set p (v) { this._v = v; },
  a: dcl.prop({
    value: 1,
    writable: false
  })
});

var xr = new XR();
XR.prototype.a = 2;
xr.p = 2;
console.log(xr.p, xr.a); // 2 1

// Now let's use property descriptors to define "class":
var XP = dcl(dcl.prop({
  m: {
    value: function (x) { return x; }
  },
  p: {
    get: function ()  { return this._v || 0; },
    set: function (v) { this._v = v; }
  },
  a: {
    value: 1,
    writable: false
  }
}));

var xp = new XP();
XP.prototype.a = 2;
xp.p = 3;
console.log(xp.p, xp.a); // 3 1

// Le's detect property descriptors intelligently repeating `XR` example:
var XD = dcl({
  m: function (x) { return x; },
  get p ()  { return this._v || 0; },
  set p (v) { this._v = v; },
  a: {
    value: 1,
    writable: false
  }
}, {detectProps: true});

var xd = new XD();
XD.prototype.a = 2;
xd.p = 4;
console.log(xd.p, xd.a); // 4 1

// ## Mixins

// Mixins is a form of a multiple inheritance, which is directly supported by `dcl`.

// Our base "class":
var J = dcl({
  declaredClass: 'J',
  constructor: function (name) { this.name = name; }
});

// Our mixins:
var K = dcl({
  declaredClass: 'K',
  hello: function () { return 'Hello, ' + this.name + '!'; }
});

var L = dcl({
  declaredClass: 'L',
  yours: function () { return 'Yours truly, ' + this.name + '.'; }
});

// Our "class" to write letters:
var Letter = dcl([J, K, L], {
  declaredClass: 'Letter'
});

var letter = new Letter('Bob');
console.log(letter.hello()); // Hello, Bob!
console.log(letter.yours()); // Yours truly, Bob.

// ## Mixins: real example

// More realistic example, which uses [Replacer](/2.x/docs/bases/Replacer)
// to pull necessary properties in a constructor:

var Replacer = require('dcl/bases/Replacer');

// The name mixin, which will handle all name-related duties:
var Name = dcl(Replacer, {
  declaredClass: 'Name',
  // Defaults for name components:
  firstName:  '',
  middleName: '',
  lastName:   '',
  // Methods:
  get fullName () {
    return this.firstName + ' ' +
      (this.middleName ? this.middleName.charAt(0) + '. ' : '') +
      this.lastName;
  }
});

// The age mixin, which handles age-related duties:
var Age = dcl(Replacer, {
  declaredClass: 'Age',
  // Defaults for age components:
  dateOfBirth: null,
  // Methods:
  get formattedDOB () {
    if (this.dateOfBirth) {
      return (this.dateOfBirth.getMonth() + 1) + '/' +
        this.dateOfBirth.getDate() + '/' +
        this.dateOfBirth.getFullYear();
    }
    return 'unknown';
  },
  get age () {
    if (this.dateOfBirth) {
      var now = new Date(),
        years = now.getFullYear() - this.dateOfBirth.getFullYear(),
        thisYearBirthday = new Date(now.getFullYear(),
          this.dateOfBirth.getMonth(), this.dateOfBirth.getDate());
      if (now.getTime() < thisYearBirthday.getTime()) {
        --years;
      }
      return years;
    }
    ; // return undefined;
  }
});

// The nickname mixin, which augments the name mixin:
var Nick = dcl(Name, {
  declaredClass: 'Nick',
  // Defaults for nick components:
  nickname: '',
  // Methods:
  get nick () {
    if (this.nickname) {
      return this.nickname;
    }
    if (Nick.names.hasOwnProperty(this.firstName)) {
      return Nick.names[this.firstName];
    }
    return this.firstName;
  }
});

// Our small dictionary of standard nicknames:
Nick.names = {Robert: 'Bob', Michael: 'Mike'};

// The main "class":
var Person = dcl([Replacer, Name, Age, Nick]);

// Instances:
var bob = new Person({
  firstName:  'Robert',
  lastName:   'Smith',
  middleName: 'John',
  dateOfBirth: new Date(1991, 7, 19)
});

var sue = new Person({
  firstName: 'Susan',
  lastName:  'Smith',
  nickname:  'Sue'
});

// Let's inspect them with our handy getters:

console.log(bob.fullName); // Robert J. Smith
console.log(bob.nick);     // Bob
console.log(bob.age);      // 25

console.log(sue.fullName); // Susan Smith
console.log(sue.nick);     // Sue
console.log(sue.age);      // undefined

// ## Debugging

// We don't save the return, because `dcl/debug` decorates `dcl`.
require('dcl/debug');

// Let's inspect a "class":
dcl.log(Person);
; // *** class Nick depends on 4 classes:
; //     dcl/bases/Replacer, Age, Name, Nick
; // *** class Nick has 1 weaver: constructor: after

// Let's inspect an instance:
dcl.log(bob);
; // *** object of class Nick
; // *** class Nick depends on 4 classes:
; //     dcl/bases/Replacer, Age, Name, Nick
; // *** class Nick has 1 weaver: constructor: after
; //     constructor: class-level advice (before 0, after 0)
