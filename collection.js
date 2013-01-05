var _ = require('underscore');
var parley = require('parley');
var async = require('async');
var util = require('sails-util');
var config = require('./config');

var Collection = module.exports = function(definition) {
		var self = this;

		// ********************************************************************
		// Configure collection-specific configuration
		// Copy over only the methods from the adapter that you need, and modify if necessary
		// ********************************************************************
		// Pass up options from adapter  (defaults to global options)
		definition.migrate = definition.migrate || definition.adapter.config.migrate || config.migrate;
		definition.globalize = !_.isUndefined(definition.globalize) ? definition.globalize : !_.isUndefined(definition.adapter.config.globalize) ? definition.adapter.config.globalize : config.globalize;

		// Pass down appropriate configuration items to adapter
		_.each(['defaultPK', 'updatedAt', 'createdAt'], function(key) {
			if(!_.isUndefined(definition[key])) {
				definition.adapter.config[key] = definition[key];
			}
		});

		// Set behavior in adapter depending on migrate option
		if(definition.migrate === 'drop') {
			definition.sync = _.bind(definition.adapter.sync.drop, definition.adapter, definition);
		} else if(definition.migrate === 'alter') {
			definition.sync = _.bind(definition.adapter.sync.alter, definition.adapter, definition);
		} else if(definition.migrate === 'safe') {
			definition.sync = _.bind(definition.adapter.sync.safe, definition.adapter, definition);
		}

		// Absorb definition methods
		_.extend(this, definition);

		// if configured as such, make each collection globally accessible
		if(definition.globalize) {
			var globalName = _.str.capitalize(this.identity);
			global[globalName] = this;
		}

		//////////////////////////////////////////
		// Dynamic finders
		//////////////////////////////////////////
		// Query the collection using the name of the attribute directly
		this.generateDynamicFinder = function(attrName, method) {

			// Figure out actual dynamic method name by injecting attribute name		
			var actualMethodName = method.replace(/\*/g, _.str.capitalize(attrName));

			// Assign this finder to the collection
			this[actualMethodName] = function dynamicMethod(value, options, cb) {
				if(_.isFunction(options)) {
					cb = options;
					options = null;
				}
				options = options || {};

				var usage = _.str.capitalize(this.identity) + '.' + method + _.str.capitalize(attrName) + '(someValue,[options],callback)';
				if(_.isUndefined(value)) usageError('No value specified!', usage);
				if(options.where) usageError('Cannot specify `where` option in a dynamic ' + method + '*() query!', usage);
				if(!_.isFunction(cb)) usageError('Invalid callback specified!', usage);

				// Build criteria query and submit it
				options.where = {};
				options.where[attrName] = value;

				// Make modifications based on method as necessary
				if (method === 'findBy*' || method === 'findBy*In') {
					return self.find(options, cb);
				} else if(method === 'findBy*Like') {
					return self.find(_.extend(options, {
						where: {
							like: options.where
						}
					}), cb);
				} else if(method === 'findAllBy*' || method === 'findAllBy*In') {
					return self.findAll(options, cb);
				} else if(method === 'findAllBy*Like') {
					return self.findAll(_.extend(options, {
						where: {
							like: options.where
						}
					}), cb);
				}
			};
		};

		// Clone attributes and augment with id, createdAt, updatedAt, etc. if necessary
		var attributes = _.clone(this.attributes) || {};
		attributes = require('./augmentAttributes')(attributes, _.extend({}, config, this.config));

		// For each defined attribute, create a dynamic finder function
		_.each(attributes, function(attrDef, attrName) {

			this.generateDynamicFinder(attrName, 'findBy*');
			this.generateDynamicFinder(attrName, 'findBy*In');
			this.generateDynamicFinder(attrName, 'findBy*Like');

			this.generateDynamicFinder(attrName, 'findAllBy*');
			this.generateDynamicFinder(attrName, 'findAllBy*In');
			this.generateDynamicFinder(attrName, 'findAllBy*Like');
		}, this);

		// Then create compound dynamic finders using the various permutations
		// TODO

		//////////////////////////////////////////
		// Promises / Deferred Objects
		//////////////////////////////////////////
		// =============================
		// TODO: (for a later release)
		// =============================
		/*
		// when done() is called (or some comparably-named terminator)
		// run every operation in the queue and trigger the callback
		this.done = function (cb) {
			// A callback is always required here
			if(!_.isFunction(cb)) usageError('Invalid callback specified!',usage);
		};

		// Join with another collection
		// (use optimized join in adapter if one was provided)
		this.join = function (anotherOne, cb) {
	
		}
	*/
		// =============================
		//////////////////////////////////////////
		// Core CRUD
		//////////////////////////////////////////
		this.create = function(values, cb) {
			// =============================
			// TODO: (for a later release)
			// =============================
			/*
			
			if (this._isDeferredObject) {
				if (this.terminated) {
					throw new Error("The callback was already triggered!");
				}

				// If this was called from a deferred object, 
				// instead of doing the normal operation, pop it on a queue for later

				if (cb) {
					// If a callback is specified, terminate the deferred object
				}
			}
			else {
				// Do the normal stuff
			}

			if (!cb) {
				// No callback specified
				// Initialize and return a deferred object
			}
		*/
			// =============================
			if(_.isFunction(values)) {
				cb = values;
				values = null;
			}
			var usage = _.str.capitalize(this.identity) + '.create({someAttr: "someValue"},callback)';
			if(!_.isFunction(cb)) usageError('Invalid callback specified!', usage);

			return this.adapter.create(this.identity, values, cb);
		};

		// Call find method in adapter
		this.find = function(criteria, options, cb) {
			var usage = _.str.capitalize(this.identity) + '.find([criteria],[options],callback)';

			if(_.isFunction(criteria)) {
				cb = criteria;
				criteria = null;
				options = null;
			} else if(_.isFunction(options)) {
				cb = options;
				options = null;
			} else if(_.isObject(options)) {
				criteria = _.extend({}, criteria, options);
			} else usageError('Invalid options specified!', usage);

			if(!_.isFunction(cb)) usageError('Invalid callback specified!', usage);

			return this.adapter.find(this.identity, criteria, cb);
		};

		this.findAll = function(criteria, options, cb) {
			var usage = _.str.capitalize(this.identity) + '.findAll([criteria],[options],callback)';
			if(_.isFunction(criteria)) {
				cb = criteria;
				criteria = null;
				options = null;
			} else if(_.isFunction(options)) {
				cb = options;
				options = null;
			} else if(_.isObject(options)) {
				criteria = _.extend({}, criteria, options);
			} else usageError('Invalid options specified!', usage);

			if(!_.isFunction(cb)) usageError('Invalid callback specified!', usage);

			return this.adapter.findAll(this.identity, criteria, cb);
		};
		this.where = this.findAll;
		this.select = this.findAll;

		this.findLike = function (criteria, options, cb) {
			var usage = _.str.capitalize(this.identity) + '.findLike([criteria],[options],callback)';
			if (criteria = normalizeLikeCriteria(criteria)) {
				return this.find(criteria, options, cb);
			}
			else usageError('Criteria must be string or object!',usage);
		};

		this.findAllLike = function (criteria, options, cb) {
			var usage = _.str.capitalize(this.identity) + '.findAllLike([criteria],[options],callback)';
			if (criteria = normalizeLikeCriteria(criteria)) {
				return this.findAll(criteria, options, cb);
			}
			else usageError('Criteria must be string or object!',usage);
		};


		// Call update method in adapter
		this.update = function(options, newValues, cb) {
			if(_.isFunction(options)) {
				cb = options;
				options = null;
			}
			var usage = _.str.capitalize(this.identity) + '.update(criteria, newValues, callback)';
			if(!options) usageError('No criteria option specified! If you\'re trying to update everything, maybe try updateAll?', usage);
			if(!newValues) usageError('No updated values specified!', usage);
			if(!_.isFunction(cb)) usageError('Invalid callback specified!', usage);

			return this.adapter.update(this.identity, options, newValues, cb);
		};
		this.updateWhere = this.update;

		// Call destroy method in adapter
		this.destroy = function(options, cb) {
			if(_.isFunction(options)) {
				cb = options;
				options = null;
			}
			var usage = _.str.capitalize(this.identity) + '.destroy(options, callback)';
			if(!options) usageError('No options specified! If you\'re trying to destroy everything, maybe try destroyAll?', usage);
			if(!_.isFunction(cb)) usageError('Invalid callback specified!', usage);

			return this.adapter.destroy(this.identity, options, cb);
		};
		this.destroyWhere = this.destroy;


		//////////////////////////////////////////
		// Composite
		//////////////////////////////////////////
		this.findOrCreate = function(criteria, values, cb) {
			if(_.isFunction(values)) {
				cb = values;
				values = null;
			}
			var usage = _.str.capitalize(this.identity) + '.findOrCreate(criteria, values, callback)';
			if(!criteria) usageError('No criteria option specified!', usage);
			if(!_.isFunction(cb)) usageError('Invalid callback specified!', usage);

			return this.adapter.findOrCreate(this.identity, criteria, values, cb);
		};


		//////////////////////////////////////////
		// Aggregate methods
		//////////////////////////////////////////
		this.createEach = function(valuesList, cb) {
			var usage = _.str.capitalize(this.identity) + '.createEach(valuesList, callback)';
			if(!valuesList) usageError('No valuesList specified!', usage);
			if(!_.isArray(valuesList)) usageError('Invalid valuesList specified (should be an array!)', usage);
			if(!_.isFunction(cb)) usageError('Invalid callback specified!', usage);
			this.adapter.createEach(this.identity, valuesList, cb);
		};

		// Iterate through a list of objects, trying to find each one
		// For any that don't exist, create them
		this.findOrCreateEach = function(valuesList, cb) {
			var usage = _.str.capitalize(this.identity) + '.findOrCreateEach(valuesList, callback)';
			if(!valuesList) usageError('No valuesList specified!', usage);
			if(!_.isArray(valuesList)) usageError('Invalid valuesList specified (should be an array!)', usage);
			if(!_.isFunction(cb)) usageError('Invalid callback specified!', usage);
			this.adapter.findOrCreateEach(this.identity, valuesList, cb);
		};

		//////////////////////////////////////////
		// Special methods
		//////////////////////////////////////////
		this.transaction = function(transactionName, atomicLogic, afterUnlock) {
			var usage = _.str.capitalize(this.identity) + '.transaction(transactionName, atomicLogicFunction, afterUnlockFunction)';
			if(!atomicLogic) {
				return usageError('Missing required parameter: atomicLogicFunction!', usage);
			} else if(!_.isFunction(atomicLogic)) {
				return usageError('Invalid atomicLogicFunction!  Not a function: ' + atomicLogic, usage);
			} else if(afterUnlock && !_.isFunction(afterUnlock)) {
				return usageError('Invalid afterUnlockFunction!  Not a function: ' + afterUnlock, usage);
			} else return this.adapter.transaction(this.identity + '.' + transactionName, atomicLogic, afterUnlock);
		};

		//////////////////////////////////////////
		// Utility methods
		//////////////////////////////////////////
		// Return a trimmed set of the specified attributes
		// with only the attributes which actually exist in the server-side model
		this.filter = function(params) {
			var trimmedParams = util.objFilter(params, function(value, name) {
				return _.contains(_.keys(this.attributes), name);
			}, this);
			return trimmedParams;
		};
		this.trimParams = this.filter;

		// Bind instance methods to collection
		_.bindAll(definition);
		_.bindAll(this);



		// Returns false if criteria is invalid,
		// otherwise returns normalized criteria obj.
		// (inside as a closure in order to get access to attributes object)
		function normalizeLikeCriteria (criteria) {
			if (_.isObject(criteria)) {
				if (!criteria.where) criteria = {where: criteria};
				criteria.where = {like: criteria.where};
			}
			// If string criteria is specified, check each attribute for a match
			else if (_.isString(criteria)) {
				var searchTerm = criteria;
				criteria = {where: {or: []}};
				_.each(attributes,function (val, attrName) {
					var obj = {like: {}};
					obj.like[attrName] = searchTerm;
					criteria.where.or.push(obj);
				});
			}
			else return false;

			return criteria;
		}
	};


function usageError(err, usage) {
	console.error("\n\n");
	throw new Error(err + '\n==============================================\nProper usage :: \n' + usage + '\n==============================================\n');
}