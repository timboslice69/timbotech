var _ = require('lodash');
var assign = require('object-assign');
var ensureCallback = require('keystone-storage-namefunctions/ensureCallback');
var FieldType = require('../Type');
var keystone = require('keystone');
var nameFunctions = require('keystone-storage-namefunctions');
var prototypeMethods = require('keystone-storage-namefunctions/prototypeMethods');
var sanitize = require('sanitize-filename');
var util = require('util');
var utils = require('keystone-utils');

/*
var CLOUDINARY_FIELDS = ['public_id', 'version', 'signature', 'format', 'resource_type', 'url', 'width', 'height', 'secure_url'];
*/

var DEFAULT_OPTIONS = {
	// This makes Cloudinary assign a unique public_id and is the same as
	//   the legacy implementation
	generateFilename: () => undefined,
	whenExists: 'overwrite',
	retryAttempts: 3, // For whenExists: 'retry'.
};

function getEmptyValue () {
	return null;
	return {
		bit_rate: 0,
		bytes: 0,
		duration: 0,
		format: "",
		frame_rate: 0,
		height: 0,
		public_id: "",
		resource_type: "",
		secure_url: "",
		signature: "",
		tags: [  ],
		url: "",
		version: 0,
		width: 0
	};
}

/**
 * cloudinaryimageexpress FieldType Constructor
 * @extends Field
 * @api public
 */
function cloudinaryimageexpress (list, path, options) {
	this._underscoreMethods = ['format'];
	this._fixedSize = 'full';
    this._defaultSize = 'full';
	this._properties = ['select', 'selectPrefix', 'autoCleanup', 'folder', 'uploadPreset'];

    this.folder = ('folder' in options) ? options.folder : null;
    this.uploadPreset = ('uploadPreset' in options) ? options.uploadPreset : null;

	if (options.filenameAsPublicID) {
		// Produces the same result as the legacy filenameAsPublicID option
		options.generateFilename = nameFunctions.originalFilename;
		options.whenExists = 'overwrite';
	}
	options = assign({}, DEFAULT_OPTIONS, options);
	options.generateFilename = ensureCallback(options.generateFilename);

	cloudinaryimageexpress.super_.call(this, list, path, options);
	// validate cloudinary config
	if (!keystone.get('cloudinary config')) {
		throw new Error(
			'Invalid Configuration\n\n'
			+ 'cloudinaryimageexpress fields (' + list.key + '.' + this.path + ') require the "cloudinary config" option to be set.\n\n'
			+ 'See http://keystonejs.com/docs/configuration/#services-cloudinary for more information.\n'
		);
	}
}
cloudinaryimageexpress.properName = 'CloudinaryImageExpress';
util.inherits(cloudinaryimageexpress, FieldType);

/**
 * Gets the folder for videos in this field
 */
cloudinaryimageexpress.prototype.getFolder = function () {
	var folder = null;
	if (keystone.get('cloudinary folders') || this.options.folder) {
		if (typeof this.options.folder === 'string') {
			folder = this.options.folder;
		} else {
			var folderList = keystone.get('cloudinary prefix') ? [keystone.get('cloudinary prefix')] : [];
			folderList.push(this.list.path);
			folderList.push(this.path);
			folder = folderList.join('/');
		}
	}
	return folder;
};

/**
 * Registers the field on the List's Mongoose Schema.
 */
cloudinaryimageexpress.prototype.addToSchema = function (schema) {

	var cloudinary = require('cloudinary');

	var field = this;

	var paths = this.paths = {

		bytes: this.path + '.bytes',
		format: this.path + '.format',
		height: this.path + '.height',
		public_id: this.path + '.public_id',
		resource_type: this.path + '.resource_type',
		secure_url: this.path + '.secure_url',
		signature: this.path + '.signature',
		url: this.path + '.url',
		version: this.path + '.version',
		width: this.path + '.width',
		// virtuals
		exists: this.path + '.exists',
		folder: this.path + '.folder',
		// form paths
		select: this.path + '_select',
	};

	var schemaPaths = this._path.addTo({}, {
		bit_rate: Number,
		bytes: Number,
		duration: Number,
		format: String,
		frame_rate: Number,
		height: Number,
		public_id: String,
		resource_type: String,
		secure_url: String,
		signature: String,
		url: String,
		version: Number,
		width: Number
	});

	schema.add(schemaPaths);

	var exists = function (item) {
		return (item.get(paths.public_id) ? true : false);
	};

	// The .exists virtual indicates whether an video is stored
	schema.virtual(paths.exists).get(function () {
		return schemaMethods.exists.apply(this);
	});

	// The .folder virtual returns the cloudinary folder used to upload/select videos
	schema.virtual(paths.folder).get(function () {
		return schemaMethods.folder.apply(this);
	});

	var src = function (item, options) {
		if (!exists(item)) {
			return '';
		}
		options = (typeof options === 'object') ? options : {};
		if (!('fetch_format' in options) && keystone.get('cloudinary webp') !== false) {
			options.fetch_format = 'auto';
		}
		if (!('progressive' in options) && keystone.get('cloudinary progressive') !== false) {
			options.progressive = true;
		}
		if (!('secure' in options) && keystone.get('cloudinary secure')) {
			options.secure = true;
		}
		options.version = item.get(paths.version);
		options.format = options.format || item.get(paths.format);

		return cloudinary.url(item.get(paths.public_id), options);
	};

	var reset = function (item) {
		item.set(field.path, getEmptyValue());
	};

	var addSize = function (options, width, height, other) {
		if (width) options.width = width;
		if (height) options.height = height;
		if (typeof other === 'object') {
			assign(options, other);
		}
		return options;
	};

	var schemaMethods = {
		exists: function () {
			return exists(this);
		},
		folder: function () {
			return field.getFolder();
		},
		src: function (options) {
			return src(this, options);
		},
		tag: function (options) {
			return exists(this) ? cloudinary.video(this.get(field.path).public_id, options) : '';
		},
		/**
		 * Resets the value of the field
		 *
		 * @api public
		 */
		reset: function () {
			reset(this);
		},
		/**
		 * Deletes the video from Cloudinary and resets the field
		 *
		 * @api public
		 */
		delete: function () {
			var _this = this;
			var promise = new Promise(function (resolve) {
				cloudinary.uploader.destroy(_this.get(paths.public_id), function (result) {
					resolve(result);
				});
			});
			reset(this);
			return promise;
		},

	};

	_.forEach(schemaMethods, function (fn, key) {
		field.underscoreMethod(key, fn);
	});

	// expose a method on the field to call schema methods
	this.apply = function (item, method) {
		return schemaMethods[method].apply(item, Array.prototype.slice.call(arguments, 2));
	};

	this.bindUnderscoreMethods();
};

/**
 * Formats the field value
 */
cloudinaryimageexpress.prototype.format = function (item) {
	return item.get(this.paths.url);
};

/**
 * Gets the field's data from an Item, as used by the React components
 */
cloudinaryimageexpress.prototype.getData = function (item) {
	var value = item.get(this.path);
	return typeof value === 'object' ? value : {};
};

/**
 * Detects whether the field has been modified
 */
cloudinaryimageexpress.prototype.isModified = function (item) {
	return item.isModified(this.paths.public_id);
};


function validateInput (value) {
	// undefined values are always valid
	if (value === undefined || value === null || value === '' ) return true;
	// If a string is provided, check it can be a JSON object
    if (typeof(value) === "string" && value.substr(0,1) === "{") return true;
	// If the value is an object and has a cloudinary public_id, it is valid
	if (typeof value === 'object' && value.public_id) return true;
	// None of the above? we can't recognise it.
	return false;
}

/**
 * Validates that a value for this field has been provided in a data object
 */
cloudinaryimageexpress.prototype.validateInput = function (data, callback) {
	var value = this.getValueFromData(data);
	var result = validateInput(value);
	utils.defer(callback, result);
};

/**
 * Validates that input has been provided
 */
cloudinaryimageexpress.prototype.validateRequiredInput = function (item, data, callback) {
	// TODO: We need to also get the `files` argument, so we can check for
	// uploaded files. without it, this will return false negatives so we
	// can't actually validate required input at the moment.
	var result = true;
	// var value = this.getValueFromData(data);
	// var result = (value || item.get(this.path).public_id) ? true : false;
	utils.defer(callback, result);
};

/**
 * Always assumes the input is valid
 *
 * Deprecated
 */
cloudinaryimageexpress.prototype.inputIsValid = function () {
	return true;
};

/**
 * Trim supported file extensions from the public id because cloudinary uses these at
 * the end of the a url to dynamically convert the video filetype
 */
function trimSupportedFileExtensions (publicId) {
	var supportedExtensions = [
		'jpg', 'jpeg', 'png',
		'JPG', 'JPEG', 'PNG'
	];
	for (var i = 0; i < supportedExtensions.length; i++) {
		var extension = supportedExtensions[i];
		if (_.endsWith(publicId, extension)) {
			return publicId.slice(0, -extension.length);
		}
	}
	return publicId;
}

/**
 * Updates the value for this field in the item from a data object
 * TODO: It is not possible to remove an existing value and upload a new video
 * in the same action, this should be supported
 */
cloudinaryimageexpress.prototype.updateItem = function (item, data, files, callback) {
	// Process arguments
	if (typeof files === 'function') {
		callback = files;
		files = {};
	}
	if (!files) {
		files = {};
	}

	var field = this;

	// Prepare values
	var value = this.getValueFromData(data);
	// if value is json stringified, parse it
	if (typeof(value) == "string" && value.substr(0,1) == "{") {
		value = JSON.parse(value);
	}
	// Empty / null values reset the field
	else if (value === null || value === '' || (typeof value === 'object' && !Object.keys(value).length)) {
		value = getEmptyValue();
	}

	// If there is a valid value at this point, set it on the field
	if (typeof value === 'object') {
		item.set(this.path, value);
	}
	utils.defer(callback);
};

/**
 * Returns a callback that handles a standard form submission for the field
 *
 * Expected form parts are
 * - `field.paths.action` in `req.body` (`clear` or `delete`)
 * - `field.paths.upload` in `req.files` (uploads the video to cloudinary)
 *
 * @api public
 */
cloudinaryimageexpress.prototype.getRequestHandler = function (item, req, paths, callback) {

	var cloudinary = require('cloudinary');
	var field = this;
	if (utils.isFunction(paths)) {
		callback = paths;
		paths = field.paths;
	} else if (!paths) {
		paths = field.paths;
	}
	callback = callback || function () {};

	return function () {
		if (req.body) {
			var action = req.body[paths.action];
			if (/^(delete|reset)$/.test(action)) {
				field.apply(item, action);
			}
		}
		if (req.body && req.body[paths.select]) {
			//console.log('req.body paths', paths, paths.select, req.body[paths.select]);
			// cloudinary.api.resource(req.body[paths.select], function (result) {
			// 	if (result.error) {
			// 		callback(result.error);
			// 	} else {
			// 		item.set(field.path, result);
			// 		callback();
			// 	}
			// });
		} else {
			callback();
		}
	};
};

/* Export Field Type */
module.exports = cloudinaryimageexpress;
