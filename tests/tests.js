/* UMD.define */ (typeof define=="function"&&define||function(d,f,m){m={module:module,require:require};module.exports=f.apply(null,d.map(function(n){return m[n]||require(n)}))})
(["heya-unit", "./test_mini", "./test_dcl", "./test_advise", "./test_inherited", "./test_debug",
	"./test_raw", "./test_bases", "./test_mixins", "./test_advices"],
function(unit){

	"use strict";

	unit.run();
});
