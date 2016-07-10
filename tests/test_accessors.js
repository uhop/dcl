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
						get value () { return 42; },
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
				'read a',
				'Ab',
				'Aa',
				'0',
				'read b',
				'Bb',
				'Ab',
				'Aa',
				'Ba',
				'1',
				'read c',
				'Bb',
				'Ab',
				'Aa',
				'Ba',
				'42'
			]
		}
	]);

	return {};
});
