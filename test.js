var tap = require('tap'),
Promise = require('./index.js').Promise,
Promises = require('./index.js').Promises,
Pending = require('./index.js').Pending;

tap.test('Test classic promise', function(t) {
	t.plan(5);
	t.ok("function"===typeof Promise, "Promise must be a function");
	var test1 = new Promise(function(resolve, reject) {
		t.ok("function"===typeof resolve, "resolve must be a function");
		t.ok("function"===typeof reject, "reject must be a function")
		resolve('hi');
	});

	test1.then(function(result) {
		t.ok(result==='hi', "resolve result must be string 'hi'");
	});
	
	var test2 = new Promise(function(resolve, reject) {
		reject('rejected');
	});

	test2.catch(function(e) {
		t.ok(e=='rejected', 'exception must be string "rejected"');
	});
});


tap.test('Test pending',function (t) {
	t.plan(2);
	var firstinit=false,test3 = new Pending(function(resolve, reject, hello) {
        t.comment('Step I'); 
		if (firstinit) t.bailout("This function should not be executed");
		firstinit = true;
		setTimeout(function() { resolve(Math.random()); }, 125);
	}, ['hello']);

	var test = null;
	test3.then(function(result) {
		test = result;
		t.comment('Step II');
		t.ok(true, 'pending must be resolved');
	})
        .catch(function() {
            throw e;
        });

	test4 = new Pending(function(resolve, reject, hello) {
        t.comment('Step I'); 
		if (firstinit) t.bailout("This function should not be executed");
		firstinit = true;
		setTimeout(function() { resolve(Math.random()); }, 125);
	}, ['hello']);

	test4.then(function(result) {
		t.comment('Step II');
		t.ok(test===result, "pedings result must be same");
		t.end();
	})
        .catch(function() {
            throw e;
        });
});

tap.test('Test pending with minimum delay',function (t) {
	t.plan(2);
	var firstinit=false,test3 = new Pending(function(resolve, reject, hello) {
        t.comment('Step I'); 
		if (firstinit) t.bailout("This function should not be executed");
		firstinit = true;
		setTimeout(function() { resolve(Math.random()); }, 1);
	}, ['hello']);

	var test = null;
	test3.then(function(result) {
		test = result;
		t.comment('Step II');
		t.ok(true, 'pending must be resolved');
	})
        .catch(function() {
            throw e;
        });

	test4 = new Pending(function(resolve, reject, hello) {
        t.comment('Step I'); 
		if (firstinit) t.bailout("This function should not be executed");
		firstinit = true;
		setTimeout(function() { resolve(Math.random()); }, 1);
	}, ['hello']);

	test4.then(function(result) {
		t.comment('Step II');
		t.ok(test===result, "pedings result must be same");
		t.end();
	})
        .catch(function() {
            throw e;
        });
});

tap.test('Test pending with zero delay',function (t) {
	t.plan(2);
	var firstinit=false,test3 = new Pending(function(resolve, reject, hello) {
        t.comment('Step I'); 
		if (firstinit) t.bailout("This function should not be executed");
		firstinit = true;
		setTimeout(function() { resolve(Math.random()); });
	}, ['hello']);

	var test = null;
	test3.then(function(result) {
		test = result;
		t.comment('Step II');
		t.ok(true, 'pending must be resolved');
	})
        .catch(function() {
            throw e;
        });

	test4 = new Pending(function(resolve, reject, hello) {
        t.comment('Step I'); 
		if (firstinit) t.bailout("This function should not be executed");
		firstinit = true;
		setTimeout(function() { resolve(Math.random()); });
	}, ['hello']);

	test4.then(function(result) {
		t.comment('Step II');
		t.ok(test===result, "pedings result must be same");
		t.end();
	})
        .catch(function() {
            throw e;
        });
});

tap.test('Test pending with no delay',function (t) {
	t.plan(2);
	var firstinit=false,test3 = new Pending(function(resolve, reject, hello) {
        t.comment('Step I'); 
		if (firstinit) t.bailout("This function should not be executed");
		firstinit = true;
		resolve(Math.random());
	}, ['hello']);

	var test = null;
	test3.then(function(result) {
		test = result;
		t.comment('Step II');
		t.ok(true, 'pending must be resolved');
	})
        .catch(function() {
            throw e;
        });

	test4 = new Pending(function(resolve, reject, hello) {
        t.comment('Step I'); 
		if (firstinit) t.bailout("This function should not be executed");
		firstinit = true;
		resolve(Math.random());
	}, ['hello']);

	test4.then(function(result) {
		t.comment('Step II');
		t.ok(test===result, "pedings result must be same");
		t.end();
	})
        .catch(function() {
            throw e;
        });
});

tap.test('Test pending with delay between requests',function (t) {
	t.plan(2);
	var firstinit=false,test3 = new Pending(function(resolve, reject, hello) {
        t.comment('Step I'); 
		if (firstinit) t.bailout("This function should not be executed");
		firstinit = true;
		resolve(Math.random());
	}, ['hello']);

	var test = null;
	test3.then(function(result) {
		test = result;
		t.comment('Step II');
		t.ok(true, 'pending must be resolved');
	})
        .catch(function() {
            throw e;
        });

    setTimeout(function() {
    	test4 = new Pending(function(resolve, reject, hello) {
	        t.comment('Step I'); 
			if (firstinit) t.bailout("This function should not be executed");
			firstinit = true;
			resolve(Math.random());
		}, ['hello']);

		test4.then(function(result) {
			t.comment('Step II');
			t.ok(test!==result, "pedings result must not be same");
			t.end();
		})
	    .catch(function() {
	        throw e;
	    });
    });
	
});

tap.test('Test promises', function(t) {
	t.plan(1);
	new Promises(function(Promise) {
		var i = 0;
		for (var a = 0;a<4;++a) {
			Promise(function(resolve, reject) {
				setTimeout(function(i) {
					resolve(i);
				}.bind(this, i), i);
				i += 100;
			});
		};
	}).then(function() {
		t.ok(arguments[0]===0 && arguments[1]===100 && arguments[2]===200 && arguments[3]===300, 'Resolve must have 4 arguments 0, 100, 200, 300');
	}).catch(function() {
		t.bailout('This promises can`t reject');
	});
});


tap.test('Test promises reject', function(t) {
    t.plan(1);
    new Promises(function(Promise) {
        var i = 0;
        for (var a = 0;a<4;++a) {
            Promise(function(resolve, reject) {
                setTimeout(function(i) {
                    if (i==200)
                        reject('Shit happens');
                    else
                    resolve(i);
                }.bind(this, i), i);
                i += 100;
            });
        };
    }).catch(function() {
            t.ok(arguments[0]===0 && arguments[1]===100 && arguments[2] === 'Shit happens' && arguments[3]===300, 'Resolve must have 4 arguments 0, 100, 200, 300');
        }).then(function() {
            t.bailout('This promises can`t resolved');
        });
});