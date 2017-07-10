(function(_,f,g){g=window.dcl;g=g.mixins||(g.mixins={});g.Destroyable=f(window.dcl);})
(['../dcl'], function (dcl) {
	'use strict';

	var Destroyable = dcl({declaredClass: 'dcl/mixins/Destroyable'});
	dcl.chainBefore(Destroyable, 'destroy');

	return Destroyable;
});
