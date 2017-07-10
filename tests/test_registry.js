/* UMD.define */ (typeof define=='function'&&define||function(d,f,m){m={module:module,require:require};module.exports=f.apply(null,d.map(function(n){return m[n]||require(n)}))})
(['module', 'heya-unit', '../dcl', '../utils/registry'],
function (module, unit, dcl, registry) {
	'use strict';

	// tests

	unit.add(module, [
		function test_registry (t) {
			registry.clear();
			eval(t.TEST('registry.keys().length === 0'));

			var A = dcl({declaredClass: 'A'});
			eval(t.TEST('registry.keys().length === 1'));
			eval(t.TEST('registry.has("A")'));
			eval(t.TEST('registry.get("A") === A'));

			var B = dcl({declaredClass: 'B'});
			eval(t.TEST('registry.keys().length === 2'));
			eval(t.TEST('registry.has("A")'));
			eval(t.TEST('registry.get("A") === A'));
			eval(t.TEST('registry.has("B")'));
			eval(t.TEST('registry.get("B") === B'));

			eval(t.TEST('registry.delete("A")'));
			eval(t.TEST('registry.keys().length === 1'));
			eval(t.TEST('registry.has("B")'));
			eval(t.TEST('registry.get("B") === B'));

			var C = dcl({}); // unnamed class
			eval(t.TEST('registry.keys().length === 1'));
			eval(t.TEST('registry.has("B")'));
			eval(t.TEST('registry.get("B") === B'));

			registry.clear();
			eval(t.TEST('registry.keys().length === 0'));
		}
	]);

	return {};
});
