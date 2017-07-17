import m0 from "../dcl";export default (function(_,f){return f(m0);})
(['../dcl'], function (dcl) {
	'use strict';

	var Destroyable = dcl({declaredClass: 'dcl/mixins/Destroyable'});
	dcl.chainBefore(Destroyable, 'destroy');

	return Destroyable;
});
