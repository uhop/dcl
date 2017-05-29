/* UMD.define */ (typeof define=="function"&&define||function(d,f,m){m={module:module,require:require};module.exports=f.apply(null,d.map(function(n){return m[n]||require(n)}))})
(['module', 'heya-unit', '../dcl', '../advise'], function (module, unit, dcl, advise) {
	'use strict';

	// tests

	unit.add(module, [
		{
			test: function test_simple (t) {
				'use strict';

				var A = dcl({
					constructor () { this.__value = 0; },
					get m () { return this.__value; },
					set m (v) { this.__value = v; }
				});

				var a = new A();
				t.info('interrogate a');
				t.info('' + a.m);
				a.m = 5;
				t.info('' + a.m);

				var h = advise(a, 'm', {
					get: {
						before: function () { t.info('Xbg'); },
						after:  function () { t.info('Xag'); },
						around: function (sup) {
							return function () {
								return sup.call(this) + 1;
							};
						}
					},
					set: {
						before: function () { t.info('Xbs'); },
						after:  function () { t.info('Xas'); },
						around: function (sup) {
							return function (v) {
								sup.call(this, v + 1);
							};
						}
					}
				});

				t.info('interrogate a');
				t.info('' + a.m);
				a.m = 5;
				t.info('' + a.m);

				h.unadvise();

				t.info('interrogate a');
				t.info('' + a.m);
				a.m = 5;
				t.info('' + a.m);
			},
			logs: [
				'interrogate a', '0', '5',
				'interrogate a', 'Xbg', 'Xag', '6', 'Xbs', 'Xas', 'Xbg', 'Xag', '7',
				'interrogate a', '6', '5'
			]
		},
		{
			test: function test_AB (t) {
				'use strict';

				var A = dcl({
					constructor () { this.__value = 0; },
					get m () { return this.__value; },
					set m (v) { this.__value = v; }
				});

				var B = dcl(A, {
					m: dcl.prop({
						get: dcl.advise({
							before: function () { t.info('Bbg'); },
							after:  function () { t.info('Bag'); },
							around: function (sup) {
								return function () {
									return sup.call(this) + 1;
								};
							}
						}),
						set: dcl.advise({
							before: function () { t.info('Bbs'); },
							after:  function () { t.info('Bas'); },
							around: function (sup) {
								return function (v) {
									sup.call(this, v + 1);
								};
							}
						})
					})
				});

				var b = new B();
				t.info('interrogate b');
				t.info('' + b.m);
				b.m = 5;
				t.info('' + b.m);

				var h = advise(b, 'm', {
					get: {
						before: function () { t.info('Xbg'); },
						after:  function () { t.info('Xag'); },
						around: function (sup) {
							return function () {
								return sup.call(this) + 1;
							};
						}
					},
					set: {
						before: function () { t.info('Xbs'); },
						after:  function () { t.info('Xas'); },
						around: function (sup) {
							return function (v) {
								sup.call(this, v + 1);
							};
						}
					}
				});

				t.info('interrogate b');
				t.info('' + b.m);
				b.m = 5;
				t.info('' + b.m);

				h.unadvise();

				t.info('interrogate b');
				t.info('' + b.m);
				b.m = 5;
				t.info('' + b.m);
			},
			logs: [
				'interrogate b', 'Bbg', 'Bag', '1', 'Bbs', 'Bas', 'Bbg', 'Bag', '7',
				'interrogate b',
					'Xbg', 'Bbg', 'Bag', 'Xag', '8',
					'Xbs', 'Bbs', 'Bas', 'Xas',
					'Xbg', 'Bbg', 'Bag', 'Xag', '9',
				'interrogate b', 'Bbg', 'Bag', '8', 'Bbs', 'Bas', 'Bbg', 'Bag', '7'
			]
		},
		{
			test: function test_12 (t) {
				'use strict';

				var A = dcl({
					constructor () { this.__value = 0; },
					get m () { return this.__value; },
					set m (v) { this.__value = v; }
				});

				var a = new A();
				t.info('interrogate a');
				t.info('' + a.m);
				a.m = 5;
				t.info('' + a.m);

				var h1 = advise(a, 'm', {
					get: {
						before: function () { t.info('Xbg'); },
						after:  function () { t.info('Xag'); },
						around: function (sup) {
							return function () {
								return sup.call(this) + 1;
							};
						}
					},
					set: {
						before: function () { t.info('Xbs'); },
						after:  function () { t.info('Xas'); },
						around: function (sup) {
							return function (v) {
								sup.call(this, v + 1);
							};
						}
					}
				});

				t.info('interrogate a');
				t.info('' + a.m);
				a.m = 5;
				t.info('' + a.m);

				var h2 = advise(a, 'm', {
					get: {
						before: function () { t.info('Ybg'); },
						after:  function () { t.info('Yag'); },
						around: function (sup) {
							return function () {
								return sup.call(this) + 1;
							};
						}
					},
					set: {
						before: function () { t.info('Ybs'); },
						after:  function () { t.info('Yas'); },
						around: function (sup) {
							return function (v) {
								sup.call(this, v + 1);
							};
						}
					}
				});

				t.info('interrogate a');
				t.info('' + a.m);
				a.m = 5;
				t.info('' + a.m);

				h2.unadvise();

				t.info('interrogate a');
				t.info('' + a.m);
				a.m = 5;
				t.info('' + a.m);

				h1.unadvise();

				t.info('interrogate a');
				t.info('' + a.m);
				a.m = 5;
				t.info('' + a.m);
			},
			logs: [
				'interrogate a', '0', '5',
				'interrogate a',
					'Xbg', 'Xag', '6', 'Xbs', 'Xas', 'Xbg', 'Xag', '7',
				'interrogate a',
					'Ybg', 'Xbg', 'Xag', 'Yag', '8',
					'Ybs', 'Xbs', 'Xas', 'Yas',
					'Ybg', 'Xbg', 'Xag', 'Yag', '9',
				'interrogate a',
					'Xbg', 'Xag', '8', 'Xbs', 'Xas', 'Xbg', 'Xag', '7',
				'interrogate a', '6', '5'
			]
		},
		{
			test: function test_21 (t) {
				'use strict';

				var A = dcl({
					constructor () { this.__value = 0; },
					get m () { return this.__value; },
					set m (v) { this.__value = v; }
				});

				var a = new A();
				t.info('interrogate a');
				t.info('' + a.m);
				a.m = 5;
				t.info('' + a.m);

				var h1 = advise(a, 'm', {
					get: {
						before: function () { t.info('Xbg'); },
						after:  function () { t.info('Xag'); },
						around: function (sup) {
							return function () {
								return sup.call(this) + 1;
							};
						}
					},
					set: {
						before: function () { t.info('Xbs'); },
						after:  function () { t.info('Xas'); },
						around: function (sup) {
							return function (v) {
								sup.call(this, v + 1);
							};
						}
					}
				});

				t.info('interrogate a');
				t.info('' + a.m);
				a.m = 5;
				t.info('' + a.m);

				var h2 = advise(a, 'm', {
					get: {
						before: function () { t.info('Ybg'); },
						after:  function () { t.info('Yag'); },
						around: function (sup) {
							return function () {
								return sup.call(this) + 1;
							};
						}
					},
					set: {
						before: function () { t.info('Ybs'); },
						after:  function () { t.info('Yas'); },
						around: function (sup) {
							return function (v) {
								sup.call(this, v + 1);
							};
						}
					}
				});

				t.info('interrogate a');
				t.info('' + a.m);
				a.m = 5;
				t.info('' + a.m);

				h1.unadvise();

				t.info('interrogate a');
				t.info('' + a.m);
				a.m = 5;
				t.info('' + a.m);

				h2.unadvise();

				t.info('interrogate a');
				t.info('' + a.m);
				a.m = 5;
				t.info('' + a.m);
			},
			logs: [
				'interrogate a', '0', '5',
				'interrogate a',
					'Xbg', 'Xag', '6', 'Xbs', 'Xas', 'Xbg', 'Xag', '7',
				'interrogate a',
					'Ybg', 'Xbg', 'Xag', 'Yag', '8',
					'Ybs', 'Xbs', 'Xas', 'Yas',
					'Ybg', 'Xbg', 'Xag', 'Yag', '9',
				'interrogate a',
					'Ybg', 'Yag', '8', 'Ybs', 'Yas', 'Ybg', 'Yag', '7',
				'interrogate a', '6', '5'
			]
		}
	]);

	return {};
});
