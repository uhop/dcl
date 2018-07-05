define
(['../dcl'], function (dcl) {
	'use strict';

	var Destroyable = dcl({declaredClass: 'dcl/mixins/Destroyable'});
	dcl.chainBefore(Destroyable, 'destroy');

	return Destroyable;
});
