
var Promise = require('es6-promise').Promise;
var injection = require('injection');

var Polypromise = function() {

}


var test = new Pending(function(resolve,reject,a,b,c,) {

}, [1,2,3])

/*
Pending
*/
var pendings = {},
Pending = function(callback, args) {
    this.$then = null;
    this.$catch = null;

    var id = callback.toString()+( "object"===typeof args ? JSON.stringify(args) : args.toString() );
    if (pendings[id]) {
        pendings[id].queue.push(this);
    } else {
        pendings[id] = {
            queue: []
        };
        pendings[id].queue.push(this);

        if ("function"===typeof callback) {
            var promising = new Promise(function(resolve, reject) {
            	injection(callback, {
	            	resolve: resolve,
	            	reject: reject
	            }, this).apply(this, args);
            });
        } else if ("object"===typeof callback) {
            var promising = callback;
        } else {
            throw 'Pending first argument can be function or Promise, but '+typeof callback+' found';
        }
        promising.then(function(result) {
            var requeue = pendings[id].queue;
            delete pendings[id];

            for (var i = 0; i < requeue.length;++i) {
                requeue[i].$resolve(result);
            }
        })
        .catch(function(result) {
            var requeue = pendings[id].queue;
            delete pendings[id];
            for (var i = 0; i < requeue.length;++i) {
                requeue[i].$catch(result);
            }
        });
    }
};
Pending.prototype = {
    constructor: Pending,
    $resolve: function(result) {
        if ("function"===typeof this.$then) this.$then(result);
    },
    $reject: function(result) {
        if ("function"===typeof this.$catch) this.$catch(result);
    },
    then: function(cb) {
        this.$then = cb;
        return this;
    },
    catch: function(cb) {
        this.$catch = cb;
        return this;
    }
};


Polypromise.Promise = Promise;
Polypromise.Pending = Pending;
