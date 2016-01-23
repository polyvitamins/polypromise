var tap = require('tap'),
    Promise = require('./../index.js').Promise,
    Promises = require('./../index.js').Promises,
    Pending = require('./../index.js').Pending;
var bit = require('bitmask');


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

tap.test('Test promises timeout', function(t) {
    t.plan(3);
    var step = 0;
    new Promises(function(Promise) {
        var i = 0;
        for (var a = 0;a<2;++a) {
            Promise(bit(function(a, resolve, reject) {
                resolve(a+'-one');

                setTimeout(function(a) {
                    resolve(a+'-two');
                }.bind(this, a), 1000);
                
            }.bind(this, a)).set(POLYPROMISE_IMMEDIATE));
        };
    }).then(function(val1, val2) {
        if (step===0) t.ok(val1==='0-one' && val2==='1-one', 'Polypromise at resolve #1 must be equal 0-one && 1-one. '+val1+', '+val2+' given');
        if (step===1) t.ok(val1==='0-two' && val2==='1-one', 'Polypromise at resolve #1 must be equal 0-two && 1-one. '+val1+', '+val2+' given');
        if (step===2) t.ok(val1==='0-two' && val2==='1-two', 'Polypromise at resolve #1 must be equal 0-two && 1-two '+val1+', '+val2+' given');
        step++;
    }, true).catch(function() {
        t.bailout('This promises can`t reject');
    });
});
