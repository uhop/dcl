# `dcl`


[![Build status][travis-image]][travis-url]
[![NPM version][npm-image]][npm-url]

[![Greenkeeper][greenkeeper-image]][greenkeeper-url]
[![Dependencies][deps-image]][deps-url]
[![devDependencies][dev-deps-image]][dev-deps-url]

A minimalistic yet complete JavaScript package for [node.js](http://nodejs.org)
and modern browsers that implements OOP with mixins + AOP at both "class" and
object level. Implements [C3 MRO](http://www.python.org/download/releases/2.3/mro/)
to support a Python-like multiple inheritance, efficient supercalls, chaining,
full set of advices, and provides some useful generic building blocks. The whole
package comes with an extensive test set, and it is fully compatible with the strict mode.

The package was written with debuggability of your code in mind. It comes with
a special debug module that explains mistakes, verifies created objects, and helps
to keep track of AOP advices. Because the package uses direct static calls to super
methods, you don't need to step over unnecessary stubs. In places where stubs are
unavoidable (chains or advices) they are small, and intuitive.

Based on ES5, the `dcl 2.x` works on Node and all ES5-compatible browsers. It fully
supports property descriptors, including AOP advices for getters and setters,
as well as regular values. If your project needs to support legacy browsers,
please consider `dcl 1.x`.

The library includes a small library of useful base classes, mixins, and advices.

The main hub of everything `dcl`-related is [dcljs.org](http://www.dcljs.org/),
which hosts [extensive documentation](http://www.dcljs.org/docs/).

# Examples

Create simple class:

```js
var A = dcl({
  constructor: function (x) { this.x = x; },
  m: function () { return this.x; }
});
```

Single inheritance:

```js
var B = dcl(A, {
  // no constructor
  // constructor of A will be called automatically

  m: function () { return this.x + 1; }
});
```

Multiple inheritance with mixins:

```js
var M = dcl({
  sqr: function () { var x = this.m(); return x * x; }
});

var AM = dcl([A, M]);
var BM = dcl([B, M]);

var am = new AM(2);
console.log(am.sqr()); // 4

var bm = new BM(2);
console.log(bm.sqr()); // 9
```

Super call:

```js
var AMSuper = dcl([A, M], {
  m: dcl.superCall(function (sup) {
    return function () {
      return sup.call(this) + 1;
    };
  })
});

var ams = new AMSuper(3);
console.log(ams.sqr()); // 16
```

AOP advices:

```js
var C = dcl(AMSuper, {
  constructor: dcl.advise({
    before: function (x) {
      console.log('ctr arg:', x);
    },
    after: function () {
      console.log('this.x:', this.x);
    }
  }),
  m: dcl.after(function (args, result, makeReturn) {
    console.log('m() returned:', result);
    // let's fix it
    makeReturn(5);
  })
});

var c = new C(1);
// prints:
// ctr arg: 1
// this.x: 1
console.log(c.sqr());
// prints:
// m() returned: 2
// 25
```

Super call with getters:

```js
var G = dcl({
  constructor: function (x) { this._x = x; },
  get x () { return this._x; }
});

var g = new G(1);
console.log(g.x); // 1

var F = dcl(G, {
  x: dcl.prop({
    get: dcl.superCall(function (sup) {
      return function () {
        return sup.call(this) + 1;
      };
    })
  })
});

var f = new F(1);
console.log(f.x); // 2
```

Advise an object:

```js
function D (x) { this.x = x; }
D.prototype.m = function (y) { return this.x + y; }

var d = new D(1);
console.log(d.m(2)); // 3

advise(d, 'm', {
  before: function (y) { console.log('y:', y); },
  around: function (sup) {
    return function (y) {
      console.log('around');
      return 2 * sup.call(this, y + 1);
    };
  },
  after: function (args, result) {
    console.log('# of args:', args.length);
    console.log('args[0]:', args[0]);
    console.log('result:', result);
  }
});

console.log(d.m(2));
// prints:
// y: 2
// around
// # of args: 1
// args[0]: 2
// result: 8
```

Additionally `dcl` provides a small library of predefined
[base classes](http://www.dcljs.org/2.x/docs/bases/),
[mixins](http://www.dcljs.org/2.x/docs/mixins/),
and [useful advices](http://www.dcljs.org/2.x/docs/advices/). Check them out too.

For more examples, details, howtos, and why, please read [the docs](http://www.dcljs.org/docs/).

# How to install

With `npm`:

```
npm install --save dcl
```

With `yarn`:

```
yarn add dcl
```

With `bower`:

```
bower install --save dcl
```

## How to use

`dcl` can be installed with `npm`, `yarn`, or `bower` with files available from
`node_modules/` or `bower_components/`. By default, it uses UMD, and ready
to be used with Node's `require()`:

```js
// if you run node.js, or CommonJS-compliant system
var dcl = require('dcl');
var advise = require('dcl/advise');
```

[Babel](https://babeljs.io/) can have problems while compiling UMD modules, because it appears to generate calls to `require()` dynamically. Specifically for that `dcl` comes with a special ES6 distribution located in `"/es6/"` directory:

```js
// ES6 FTW!
import dcl from 'dcl/es6/dcl';
import advise from 'dcl/es6/advise';
```

*Warning:* make sure that when you use Babel you include `dcl/es6` sources into the compilation set usually by adding `node_modules/dcl/es6` directory.

It can be used with AMD out of box:

```js
// if you use dcl in a browser with AMD (like RequireJS):
require(['dcl'], function (dcl) {
    // the same code that uses dcl
});

// or when you define your own module:
define(['dcl'], function (dcl) {
	// your dcl-using code goes here
});
```

If you prefer to use globals in a browser, include files with `<script>` from `/dist/`:

```html
<script src='node_modules/dcl/dist/dcl.js'></script>
```

Alternatively, you can use https://unpkg.com/ with AMD or globals. For example:

```html
<script src='https://unpkg.com/dcl@latest/dist/dcl.js'></script>
```

# Documentation

`dcl` is extensively documented in [the docs](http://www.dcljs.org/docs/).

# Versions

## 2.x

- 2.0.11 &mdash; *Technical release.*
- 2.0.10 &mdash; *Refreshed dev dependencies.*
- 2.0.9 &mdash; *Refreshed dev dependencies, removed `yarn.lock`.*
- 2.0.8 &mdash; *Added AMD distro.*
- 2.0.7 &mdash; *A bugfix. Thx [Bill Keese](https://github.com/wkeese)!*
- 2.0.6 &mdash; *Bugfixes. Thx [Bill Keese](https://github.com/wkeese)!*
- 2.0.5 &mdash; *Regenerated ES6 distro.*
- 2.0.4 &mdash; *Refreshed dev dependencies, fixed ES6 distro.*
- 2.0.3 &mdash; *Added ES6 distro.*
- 2.0.2 &mdash; *Small stability fix + new utility: registry.*
- 2.0.1 &mdash; *Small corrections to README.*
- 2.0.0 &mdash; *The initial release of 2.x.*

## 1.x

- 1.1.3 &mdash; *1.x version before forking for 2.x*

# License

BSD or AFL &mdash; your choice.

[npm-image]:         https://img.shields.io/npm/v/dcl.svg
[npm-url]:           https://npmjs.org/package/dcl
[deps-image]:        https://img.shields.io/david/uhop/dcl.svg
[deps-url]:          https://david-dm.org/uhop/dcl
[dev-deps-image]:    https://img.shields.io/david/dev/uhop/dcl.svg
[dev-deps-url]:      https://david-dm.org/uhop/dcl?type=dev
[travis-image]:      https://img.shields.io/travis/uhop/dcl.svg
[travis-url]:        https://travis-ci.org/uhop/dcl
[greenkeeper-image]: https://badges.greenkeeper.io/uhop/dcl.svg
[greenkeeper-url]:   https://greenkeeper.io/
