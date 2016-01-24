// var log = require("./logger.js").global;
var util = require("util");
var events = require("events");
var fileSystem = require("fs");
var crypto = require("crypto");
var _ = require("underscore");

// Compute the SHA1 hash of a string
function calculateSha1(f) {
	return crypto.createHash("sha1").update(f).digest("hex");
}

function defaultOnChangeListener(oldSettings, newSettings) {
	// log.debug("config.js", "Config.onChange:", "New settings loaded from '" + this._options.filePath + "':\n", newSettings);
};

function defaultOnErrorListener(error) {
	// log.error("config.js", "Config.onError:", error);
};

var defaultConfigOptions = {
	filePath: "./config.json", 
	loadImmediately: true, 
	watchConfigFile: false, 
	onChangeHandler: null, 
	onErrorHandler: null,
	defaultSettings: null
};

// Ensure\build the options object passed to the Config contructor.
function ensureConfigOptions(options) {

	if(!options) {
		options = {};
	} else {
		if(typeof options === "string") {
			options = {
				filePath: options
			};
		}
	}

	options = _.extend({}, defaultConfigOptions, options);

	return options;
};

function addInitialEvents(eventEmiter, eventName, eventHandlers) {

	if(eventHandlers) {

		if(_.isFunction(eventHandlers)) {
			eventHandlers = [
				eventHandlers
			];
		}

		if(_.isArray(eventHandlers)) {
			for(var i = 0 ; i < eventHandlers.length ; ++i) {
				var eventHandler = eventHandlers[i];
				eventEmiter.on(eventName, eventHandler);
			}
		} else {
			throw ("Config._addInitialEvents() Error: event handler is of unexpected type.");
		}
	}
};

/* 
	The function that parses the settings file.
	Return: A boolean indication if the file was successfully parsed. 
*/
function parseFileCallBack(config, err, data) {

	if(err) {
		var errorMessage = "Unable to read file. Error: " + err;
		config.emit("error", errorMessage);
		throw (errorMessage);
	}

	var errorStage = "Unknown error.";
	try {
		
		errorStage = "Unable to calculate file SHA1 hash.";
		var sha1 = (data && calculateSha1(data.toString())) || null;
		if(!!sha1 && config._fileSha1 === sha1) {
			// log.debug("config.js", "parseFileCallBack()", "File watch event triggered but SHA1 file hash did not change.");
			return true;	
		}
		config._fileSha1 = sha1;

		var old = config.settings;

		errorStage = "Unable to parse the JSON of the file.";
		var originalSettings = JSON.parse(data);

		errorStage = "Unable to apply defaults to the settings.";
		var settings;
		if(config._options.defaultSettings) {
			settings = _.extend({}, config._options.defaultSettings, originalSettings);
		} else {
			settings = originalSettings;
		}
		config.originalSettings = originalSettings;
		config.settings = settings;

		errorStage = "Unable to emit the change event.";
		config.emit("change", old, config.settings);

		return true;
	} catch(ex) {
		var errorMessage = errorStage + " Error: " + ex;
		config.emit("error", errorMessage);
		throw (errorMessage);
	}

	return false;
};

// A wrapper of parseFileCallBack that does not throw errors.
function parseFileCallBackProtected(config, err, data) {

	try {
		return parseFileCallBack(config, err, data);
	} catch(ex) {
		return false;
	}
	return false;
};

// Function that reads and parses the settings file synchronously.
function loadConfigImmediately(config) {

	var data = null;
	var error = null;

	try {
		data = fileSystem.readFileSync(config._options.filePath);
	} catch(ex) {
		error = ex;
	}
	config._initialized = parseFileCallBack(config, error, data)  || config._initialized;
};

// Function that reads and parses the settings file asynchronously.
function loadConfigAsync(config) {

	fileSystem.readFile(
		config._options.filePath,
		function (err, data) {
			config._initialized = parseFileCallBackProtected(config, err, data) || config._initialized;
		}
	);	
};

// Function that setups the settings file change listener.
function setupConfigFileWatch(config) {

	fileSystem.watch(
		config._options.filePath,
		{
			persistent: true
		},
		function (event, filename) {
			if(event == "change") {
				loadConfigAsync(config);
			}
		}
	);
};

var Config = function(options) {
	// Since Config inherits from EventEmitter the EventEmitter constructor must be called.
	events.EventEmitter.call(this);

	this._options = ensureConfigOptions(options);

	this._initialized = false;

	this.originalSettings = {};
	this.settings = {};

	this.on("change", defaultOnChangeListener);
	this.on("error", defaultOnErrorListener);

	addInitialEvents(this, "change", this._options.onChangeHandler);
	addInitialEvents(this, "error", this._options.onErrorHandler);

	if(this._options.loadImmediately) {
		loadConfigImmediately(this);
	} else {
		loadConfigAsync(this);
	}

	if(this._options.watchConfigFile) {
		setupConfigFileWatch(this);
	}
};

// Inherit EventEmitter prototype.
util.inherits(Config, events.EventEmitter);

var configFactory = function(options) {
	return new Config(options);
};

module.exports.create = configFactory;
