
var Promise = require('es6-promise').Promise;
var inject = require('injection').inject;

var Polypromise = function() {

}
/*
Pending
*/
var pendings = {}, 
Pending = function(callback, args) {
	this.$then = null;
	this.$catch = null;
	this.$id = null;
	this.$status = 0; // Pending
	
	var id = callback.toString()+( "object"===typeof args ? JSON.stringify(args) : args.toString() );

	this.$id = id;
	if (pendings[id]) {
		pendings[id].queue.push(this);
	} else {
		pendings[id] = {
			queue: [],
			result: null,
			done: 0
		};
		pendings[id].queue.push(this);

		if ("function"===typeof callback) {

            var promising = new Promise(function(resolve, reject) {
            	var injector = inject(callback, {
	            	resolve: resolve,
	            	reject: reject
	            }, this);
	            injector.apply(this, args);
            });
        } else if ("object"===typeof callback) {
            var promising = callback;
        } else {
            throw 'Pending first argument can be function or Promise, but '+typeof callback+' found';
        }
		
		promising.then(function(result) {

			var requeue = pendings[id].queue;
			pendings[id].result = result;
			pendings[id].status = 1;

			for (var i = 0; i < requeue.length;++i) {
				requeue[i].$resolve(result);
			}

			// Clear pending queue list after moment
			setTimeout(function() {
				delete pendings[id];
			});
		})
		.catch(function(result) {
			var requeue = pendings[id].queue;
			pendings[id].result = result;
			pendings[id].status = 2;
			for (var i = 0; i < requeue.length;++i) {
				requeue[i].$catch(result);
			}
			// Clear pending queue list after moment
			setTimeout(function() {
				delete pendings[id];
			});
		});
	}
};
Pending.prototype = {
	constructor: Pending,
	$resolve: function(result) {
		if ("function"===typeof this.$then) {
			pendings[this.$id].done++; if (pendings[this.$id].done==pendings[this.$id].queue) pendings.splice(0, pendings.length);
			this.$then(result);
		}
	},
	$reject: function(result) {
		if ("function"===typeof this.$catch) {
			pendings[this.$id].done++; if (pendings[this.$id].done==pendings[this.$id].queue) pendings.splice(0, pendings.length);
			this.$catch(result);
		}
	},
	then: function(cb) {
		
		if (pendings[this.$id].status===1) {
			pendings[this.$id].done++; if (pendings[this.$id].done==pendings[this.$id].queue) pendings.splice(0, pendings.length);
			cb(pendings[this.$id].$result);
		} else {
			this.$then = cb;
		}
		return this;
	},
	catch: function(cb) { 
		
		if (pendings[this.$id].status===2) {
			pendings[this.$id].done++; if (pendings[this.$id].done==pendings[this.$id].queue) pendings.splice(0, pendings.length);
			cb(pendings[this.$id].result);
		} else {
			this.$catch = cb;
		}
		
		return this;
	}
};

Polypromise.Promise = Promise;
Polypromise.Pending = Pending;


module.exports = Polypromise;
