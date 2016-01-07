
var Promise = require('es6-promise').Promise;
var inject = require('injection').inject;

var Polypromise = function() {

}







/*
Сredible
*/
var Creed = function(cb) {

	Object.defineProperty(this, '__credible__', {
		enumerable: false,
		writable: false,
		configurable: false,
		pending: false,
		resolver: false,
		value: {
			state: 0, // Wait for state
			resolveQueue: [], // Queue of then callback functions
			rejectQueue: [], // Queue of catch callback functions
			data: []
		}
	});

	if ("function"===typeof cb) this.$eval(cb);
};

/*
Promises
*/
var Promises = function(spawn) {
	// Inherit Creed
	Creed.apply(this);

	this.$promises = [];
	this.$results = [];
	this.$state = 0;
	this.$completed = 0;
	var self = this;
	var SubPromise = function(cb) {
		if (window&&this===window||global&&this===global) {
			var sp = new SubPromise(cb);
			self.$promises.push(sp);
		} else {
			self.$promises.push(this);
		}
	}.inherit(Creed);

	spawn(SubPromise);
	var self = this;
	if (this.$promises.length>0)
	for (var i = 0;i<this.$promises.length;++i) {
		this.$promises[i]
		.then(function(i) {
			this.$results[i] = arguments[1];
			++this.$completed;
			this.$$test();
		}.bind(this, i))
		.catch(function(i, e) {
			this.$results[i] = e;
			this.$state = 2; // Force reject
			++this.$completed;
			this.$$test();
		}.bind(this, i));
	}
	else {
		this.$state = 1; // Force reject
		this.$$test();
	}
}

Creed.prototype = {
	constructor: Creed,
	/*
	Just eval cb like classic promise resolver
	*/
	$eval: function(cb) {
		var self = this;
		this.__credible__.resolver = cb;
		cb.call(this, function() {
			self.$resolve.apply(self, arguments);
		}, function(result) { self.$reject.apply(self, arguments); });
		return this;
	},
	/*
	Ignore last pending resolver if got new pending
	*/
	$pending: function(cb) {
		this.__credible__.state=0;
		if (this.__credible__.pending) {
			delete this.__credible__.pending;
		}

		var p = new Creed();
		this.__credible__.pending = p;
		var self = this;
		p.then(function(response) {
			if (self.__credible__.pending===p) // Ignore deprecated pendings
			self.$resolve(response);
		})
		.catch(function(response) {
			if (self.__credible__.pending===p) // Ignore deprecated pendings
			self.$reject(response);
		});

		p.$eval(cb);
	},
	$resolve: function() {
		if (this.__credible__.state!==0) throw 'You can not change Creed state twice';
		this.__credible__.state = 1;
		this.__credible__.data = Array.prototype.slice.apply(arguments);
		for (var i =0;i<this.__credible__.resolveQueue.length;++i) {
			this.__credible__.resolveQueue[i][0].apply(this, this.__credible__.data);
			if (!this.__credible__.resolveQueue[i][1]) {
				this.__credible__.resolveQueue.splice(i, 1);i--;
			}
		}
	},
	$reject: function() {
		if (this.__credible__.state!==0) throw 'You can not change Creed state twice';
		this.__credible__.state = 2;
		this.__credible__.data = Array.prototype.slice.apply(arguments);
		for (var i =0;i<this.__credible__.resolveQueue.length;++i) {
			this.__credible__.rejectQueue[i][0].apply(this, this.__credible__.data);
			if (!this.__credible__.rejectQueue[i][1]) {
				this.__credible__.rejectQueue.splice(i, 1);i--;
			}
		}
	},
	then: function(cb, stayalive) {
		if (this.__credible__.state===0) this.__credible__.resolveQueue.push([cb, !!stayalive]);
		else if (this.__credible__.state===1) cb.apply(this, this.__credible__.data);
		return this;
	},
	catch: function(cb, stayalive) { 
		if (this.__credible__.state===0) this.__credible__.rejectQueue.push([cb, !!stayalive]);
		else if (this.__credible__.state===2) cb.apply(this, this.__credible__.data);
		return this;
	}
}


Promises.prototype = Object.create(Creed.prototype, {
	constructor: {
        value: Promises
    },
	$$test: {
        value: function() {
            if (this.$completed===this.$promises.length) {
                this.$state = this.$state!==2 ? 1 : 2;

                this[this.$state===1 ? '$resolve' : '$reject'].apply(this, this.$results);
            }
        }
    }
});




/*
Pending
*/
var pendings = {}, 
Pending = function(callback, args) {
	this.$then = null;
	this.$catch = null;
	this.$id = null;
	this.$status = 0; // Pending
	
	var id = callback.toString()+( "object"===typeof args ? JSON.stringify(args) : (args===undefined ? '' : args.toString()) );

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
Polypromise.Promises = Promises;
Polypromise.Pending = Pending;
Polypromise.Creed = Creed;


module.exports = Polypromise;
