var tap = require('tap'),
Promise = require('./../index.js').Promise,
bit = require('bitmask');

tap.test('Test pending with no delay',function (t) {
	t.plan(1);
	var a = 1;
	var firstinit=false,test3 = new Promise(bit(function(resolve, reject) {

		firstinit = true;
		resolve(Math.random());
	}).set(POLYPROMISE_IMMEDIATE))
	.then(function() {
		t.ok(a===1, "a must be 1")
	})
	.catch(function() {
		throw 'Oh no, why. That make no sense.';
	});
	a = 2;
});
