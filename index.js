
var Promise = require('es6-promise').Promise;
var bit = require('bitmask');
var mixin = require('mixin');
var Polypromise = function() {

}

bit.define('POLYPROMISE_IMMEDIATE', 10);

var CreedPrototype = {
	/*
	Just eval cb like classic promise resolver
	*/
	$eval: function(cb) {
			var self = this;
			this.__credible__.resolver = cb;
			var run = function() {
				cb.call(self, function() {
					self.$resolve.apply(self, arguments);
				}, function(result) { self.$reject.apply(self, arguments); });
			}
			if (bit(cb).test(POLYPROMISE_IMMEDIATE)||this.__credible__.config.immediate) {
				run();
			} else {
				setTimeout(run);
			}
			
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
		//if (this.__credible__.state!==0) throw 'You can not change Creed state twice';
		this.__credible__.state = 1;
		this.__credible__.data = Array.prototype.slice.apply(arguments);
		for (var i =0;i<this.__credible__.resolveQueue.length;++i) {
			this.__credible__.resolveQueue[i][0].apply(this, this.__credible__.data);
			if (!this.__credible__.resolveQueue[i][1]) {
				this.__credible__.resolveQueue.splice(i, 1);i--;
			}
		}
		this.$complete();
	},
	$reject: function() {
		//if (this.__credible__.state!==0) throw 'You can not change Creed state twice';
		this.__credible__.state = 2;
		this.__credible__.data = Array.prototype.slice.apply(arguments);
		for (var i =0;i<this.__credible__.rejectQueue.length;++i) {
			this.__credible__.rejectQueue[i][0].apply(this, this.__credible__.data);
			if (!this.__credible__.rejectQueue[i][1]) {
				this.__credible__.rejectQueue.splice(i, 1);i--;
			}
		}
		this.$complete();
	},
	$complete: function() {
		for (var i =0;i<this.__credible__.alwaysQueue.length;++i) {
			this.__credible__.alwaysQueue[i][0].apply(this, this.__credible__.data);
			if (!this.__credible__.alwaysQueue[i][1]) {
				this.__credible__.alwaysQueue.splice(i, 1);i--;
			}
		}
	},
	$clearQueues: function() {
		this.__credible__.alwaysQueue = [];
		this.__credible__.rejectQueue = [];
		this.__credible__.resolveQueue = [];
	},
	then: function(cb, stayalive) {
		if (this.__credible__.state===0 || stayalive) this.__credible__.resolveQueue.push([cb, !!stayalive]);
		if (this.__credible__.state===1) {

            cb.apply(this, this.__credible__.data);
        }
        return this;
	},
	catch: function(cb, stayalive) { 
		if (this.__credible__.state===0 || stayalive) this.__credible__.rejectQueue.push([cb, !!stayalive]);
		if (this.__credible__.state===2) cb.apply(this, this.__credible__.data);
		return this;
	},
	complete: function() {
		if (this.__credible__.state===0 || stayalive) this.__credible__.alwaysQueue.push([cb, !!stayalive]);
		if (this.__credible__.state!==0) cb.apply(this, this.__credible__.data);
		return this;
	}
},
/**
* Creed factory
*
* @param {Object} custom 
* - config:immediate {Bool} Always call $eval immediate (without setTimeout)
**/
factory = function(custom) {
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
			value: mixin({
				state: 0, // Wait for state
				resolveQueue: [], // Queue of then handler
				rejectQueue: [], // Queue of catch handler
				alwaysQueue: [], // Queue of always handler
				data: [],
				config: mixin({
					immediate: false, // Always call $eval immediate
					manual: false
				}, custom||{})
			}, custom||{})
		});

		if ("function"===typeof cb && !this.__credible__.config.manual) this.$eval(cb);
	};

	Creed.prototype = mixin({}, CreedPrototype, {
		constructor: Creed
	});
	/*Object.create(CreedPrototype, {
		constructor: {
			value: Creed
		},
		__super__: {
			enumerable: false,
			value: CreedPrototype
		}
	});*/

	return Creed;
}


var Creed = factory();

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
	this.$finished = false;
	var self = this;
	var SubPromise = function(cb) {
		if ("object"===typeof window&&this===window||"object"===typeof global&&this===global) {
			var sp = new SubPromise(cb);
		} else {
			// Inherit Creed
			Creed.call(this, cb);
			self.$promises.push(this);
		}
	};

	SubPromise.prototype = Object.create(Creed.prototype, {
		constructor: {
	        value: SubPromise
	    }
	});

	spawn(SubPromise);

	if (this.$promises.length>0)
	for (var i = 0;i<this.$promises.length;++i) {
		this.$promises[i]
		.then(function(io, val) {
			this.$results[io[0]] = val;
			if (!io[1]) { ++this.$completed; io[1]=true; }
			this.$$test();
		}.bind(this, [i,false]), true)
		.catch(function(io, e) {
			this.$results[io[0]] = e;
			this.$state = 2; // Force reject
			if (!io[1]) { ++this.$completed; io[1]=true; }
			this.$$test();
		}.bind(this, [i,false]), true);
	}
	else {
		this.$state = 1; // Force reject
		this.$$test();
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
                this.$finished = true;
                this[this.$state===1 ? '$resolve' : '$reject'].apply(this, this.$results);
            }
        }
    }
});


/*
Pending
*/
var pendings = {}, 
PendingCreed = factory({
	manual: true
}),
Pending = function(callback, args) {
	PendingCreed.apply(this);
	this.$id = null;
	var id = callback.toString()+( "object"===typeof args ? JSON.stringify(args) : (args===undefined ? '' : args.toString()) );
	this.$id = id;
	if (pendings[id]) {
		pendings[id].queue.push(this);	} else {

		pendings[id] = {
			queue: [],
			result: null,
			done: 0
		};
		pendings[id].queue.push(this);

		if ("function"===typeof callback) {

            var promising = new Creed(function(resolve, reject) {
            	callback.apply(this, [resolve, reject].concat(Array.prototype.slice.apply(args)||[]));
            }.bind(this));
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
				requeue[i].$reject(result);
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
        for (var i =0;i<this.__credible__.rejectQueue.length;++i) {
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
};


Polypromise.Promise = Creed;
Polypromise.Promises = Promises;
Polypromise.Pending = Pending;
Polypromise.Creed = Creed;
Polypromise.factory = factory;


module.exports = Polypromise;
