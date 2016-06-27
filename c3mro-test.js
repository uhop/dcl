var c3mro = require('./c3mro');

function print (list) {
	console.log(list.map(function (base) { return base.name; }).join(', '));
}

// diamond

var a = {name: 'a', _meta: {bases: [a]}},
	b = {name: 'b', _meta: {bases: [b]}},
	c = {name: 'c', _meta: {bases: [c]}},
	d = {name: 'd', _meta: {bases: [d]}};

var abc = {
			name: 'abc',
			_meta: {
				bases: [a, b, c /*, abc*/]
			}
		},
	adc = {
			name: 'adc',
			_meta: {
				bases: [a, d, c /*, adc*/]
			}
		};
abc._meta.bases.push(abc);
adc._meta.bases.push(adc);

var abcd1 = c3mro([abc, adc]);
print(abcd1);

var abcd2 = c3mro([adc, abc]);
print(abcd2);

// triangle

var ac = {
			name: 'ac',
			_meta: {
				bases: [a, c /*, ac*/]
			}
		},
	bc = {
			name: 'bc',
			_meta: {
				bases: [b, c /*, bc*/]
			}
		};
ac._meta.bases.push(ac);
bc._meta.bases.push(bc);

var abc1 = c3mro([abc, ac]);
print(abc1);

var abc2 = c3mro([ac, abc]);
print(abc2);

var abc3 = c3mro([abc, bc]);
print(abc3);

var abc4 = c3mro([bc, abc]);
print(abc4);

// impossible

var ab = {
	name: 'ab',
	_meta: {
		bases: [a, b /*, ab*/]
	}
},
	ba = {
		name: 'ba',
		_meta: {
			bases: [b, a /*, ba*/]
		}
	};
ab._meta.bases.push(ab);
ba._meta.bases.push(ba);

var x = c3mro([ab, ba]);
print(x);
