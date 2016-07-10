/* UMD.define */ (typeof define=="function"&&define||function(d,f,m){m={module:module,require:require};module.exports=f.apply(null,d.map(function(n){return m[n]||require(n)}))})
(['module', 'heya-unit', '../dcl'], function (module, unit, dcl) {
	'use strict';

	// tests

	unit.add(module, [
		function test_get_super (t) {
			var A = dcl({
					constructor: function () {
						this.__value = 0;
					},
					get value () { return this.__value; }
				}),
				B = dcl(A, {
					value: dcl.prop({
						get: dcl.superCall(function (sup) {
							return function () {
								return sup.call(this) + 1;
							};
						})
					})
				}),
				C = dcl(B, {
					get value () { return 42; }
				});

			var a = new A(), b = new B(), c = new C();

			eval(t.TEST('a.value === 0'));
			eval(t.TEST('b.value === 1'));
			eval(t.TEST('c.value === 42'));

			a.__value = b.__value = c.__value = 3;

			eval(t.TEST('a.value === 3'));
			eval(t.TEST('b.value === 4'));
			eval(t.TEST('c.value === 42'));
		},
		function test_set_super (t) {
			var A = dcl({
					constructor: function () {
						this.__value = 0;
					},
					set value (x) { this.__value = x; }
				}),
				B = dcl(A, {
					value: dcl.prop({
						set: dcl.superCall(function (sup) {
							return function (x) {
								sup.call(this, x + 1);
							};
						})
					})
				}),
				C = dcl(B, {
					set value (x) { this.__value = 42; }
				});

			var a = new A(), b = new B(), c = new C();

			a.value = 5;
			eval(t.TEST('a.__value === 5'));

			b.value = 5;
			eval(t.TEST('b.__value === 6'));

			c.value = 5;
			eval(t.TEST('c.__value === 42'));
		},
		function test_get_set_super (t) {
			var A = dcl({
					constructor: function () {
						this.__value = 0;
					},
					get value ()  { return this.__value; },
					set value (x) { this.__value = x; }
				}),
				B = dcl(A, {
					value: dcl.prop({
						get: dcl.superCall(function (sup) {
							return function () {
								return sup.call(this) + 1;
							};
						}),
						set: dcl.superCall(function (sup) {
							return function (x) {
								sup.call(this, x + 1);
							};
						})
					})
				}),
				C = dcl(B, {
					get value () { return 42; },
					set value (x) { this.__value = 42; }
				});

			var a = new A(), b = new B(), c = new C();

			eval(t.TEST('a.value === 0 && a.__value === 0'));
			a.value = 5;
			eval(t.TEST('a.value === 5 && a.__value === 5'));

			eval(t.TEST('b.value === 1 && b.__value === 0'));
			b.value = 5;
			eval(t.TEST('b.value === 7 && b.__value === 6'));

			eval(t.TEST('c.value === 42 && c.__value === 0'));
			c.value = 5;
			eval(t.TEST('c.value === 42 && c.__value === 42'));
		},
		{
			test: function test_get_side_advices (t) {
				var A = dcl({
						constructor: function () {
							this.__value = 0;
						},
						value: dcl.prop({
							get: dcl.advise({
								before: function () { t.info('Ab'); },
								around: function (sup) {
									return function () { return this.__value; };
								},
								after:  function () { t.info('Aa'); }
							})
						})
					}),
					B = dcl(A, {
						value: dcl.prop({
							get: dcl.advise({
								before: function () { t.info('Bb'); },
								around: function (sup) {
									return function () { return sup.call(this) + 1; };
								},
								after:  function () { t.info('Ba'); }
							})
						})
					}),
					C = dcl(B, {
						get value () { return 42; }
					});

				var a = new A(), b = new B(), c = new C();

				t.info('read a');
				t.info(a.value + '');
				t.info('read b');
				t.info(b.value + '');
				t.info('read c');
				t.info(c.value + '');
			},
			logs: [
				'read a', 'Ab', 'Aa', '0',
				'read b', 'Bb', 'Ab', 'Aa', 'Ba', '1',
				'read c', 'Bb', 'Ab', 'Aa', 'Ba', '42'
			]
		},
		{
			test: function test_set_side_advices (t) {
				var A = dcl({
						constructor: function () {
							this.__value = 0;
						},
						value: dcl.prop({
							set: dcl.advise({
								before: function () { t.info('Ab'); },
								around: function (sup) {
									return function (x) { this.__value = x; };
								},
								after:  function () { t.info('Aa'); }
							})
						})
					}),
					B = dcl(A, {
						value: dcl.prop({
							set: dcl.advise({
								before: function () { t.info('Bb'); },
								around: function (sup) {
									return function (x) { sup.call(this, x + 1); };
								},
								after:  function () { t.info('Ba'); }
							})
						})
					}),
					C = dcl(B, {
						set value (x) { this.__value = 42; }
					});

				var a = new A(), b = new B(), c = new C();

				t.info('write a');
				a.value = 5;
				t.info(a.__value + '');
				t.info('write b');
				b.value = 5;
				t.info(b.__value + '');
				t.info('write c');
				c.value = 5;
				t.info(c.__value + '');
			},
			logs: [
				'write a', 'Ab', 'Aa', '5',
				'write b', 'Bb', 'Ab', 'Aa', 'Ba', '6',
				'write c', 'Bb', 'Ab', 'Aa', 'Ba', '42'
			]
		},
		{
			test: function test_get_set_side_advices (t) {
				var A = dcl({
						constructor: function () {
							this.__value = 0;
						},
						value: dcl.prop({
							get: dcl.advise({
								before: function () { t.info('Abg'); },
								around: function (sup) {
									return function () { return this.__value; };
								},
								after:  function () { t.info('Aag'); }
							}),
							set: dcl.advise({
								before: function () { t.info('Ab'); },
								around: function (sup) {
									return function (x) { this.__value = x; };
								},
								after:  function () { t.info('Aa'); }
							})
						})
					}),
					B = dcl(A, {
						value: dcl.prop({
							get: dcl.advise({
								before: function () { t.info('Bbg'); },
								around: function (sup) {
									return function () { return sup.call(this) + 1; };
								},
								after:  function () { t.info('Bag'); }
							}),
							set: dcl.advise({
								before: function () { t.info('Bb'); },
								around: function (sup) {
									return function (x) { sup.call(this, x + 1); };
								},
								after:  function () { t.info('Ba'); }
							})
						})
					}),
					C = dcl(B, {
						get value () { return 42; },
						set value (x) { this.__value = 42; }
					});

				var a = new A(), b = new B(), c = new C();

				t.info('read a');
				t.info(a.value + '');
				t.info(a.__value + '');
				t.info('write a');
				a.value = 5;
				t.info(a.value + '');
				t.info(a.__value + '');

				t.info('read b');
				t.info(b.value + '');
				t.info(b.__value + '');
				t.info('write b');
				b.value = 5;
				t.info(b.value + '');
				t.info(b.__value + '');

				t.info('read c');
				t.info(c.value + '');
				t.info(c.__value + '');
				t.info('write c');
				c.value = 5;
				t.info(c.value + '');
				t.info(c.__value + '');
			},
			logs: [
				'read a', 'Abg', 'Aag', '0', '0',
				'write a', 'Ab', 'Aa', 'Abg', 'Aag', '5', '5',
				'read b', 'Bbg', 'Abg', 'Aag', 'Bag', '1', '0',
				'write b', 'Bb', 'Ab', 'Aa', 'Ba', 'Bbg', 'Abg', 'Aag', 'Bag', '7', '6',
				'read c', 'Bbg', 'Abg', 'Aag', 'Bag', '42', '0',
				'write c', 'Bb', 'Ab', 'Aa', 'Ba', 'Bbg', 'Abg', 'Aag', 'Bag', '42', '42'
			]
		}
	]);

	return {};
});