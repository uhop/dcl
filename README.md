# DCL [![Build Status](https://secure.travis-ci.org/uhop/dcl.png?branch=master)](http://travis-ci.org/uhop/dcl)

A minimalistic yet complete JavaScript package for node.js and browsers that implements OOP with mixins + AOP at both "class" and object level. Implements C3 MRO to support a Python-like multiple inheritance, efficient supercalls, chaining, full set of advices, and provides some useful generic building blocks. The whole package comes with an extensive test set (85 tests at the time of writing) and fully compatible with the strict mode.

The package was written with debugability of your code in mind. It comes with a special debug module that explains mistakes, verifies created objects, and helps to keep track of AOP advices. Because the package uses direct static calls to super methods, you don't need to step over unnecessary stubs. In places where stubs are unavoidable (chains or advices) they are small, and intuitive.

If you migrate your code from a legacy framework that implements dynamic (rather than static) supercalls, take a look at the module "inherited" that dispatches supercalls dynamically trading off the simplicity of the code for some run-time CPU use, and a little bit less convenient debugging of such calls due to an extra stub between your methods.
