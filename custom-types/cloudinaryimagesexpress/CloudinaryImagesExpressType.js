var _ = require('lodash');
var assign = require('object-assign');
var FieldType = require('../Type');
var keystone = require('keystone');
var async = require('async');
var util = require('util');
var cloudinary = require('cloudinary');

function getEmptyValue() {
    return {
        public_id: '',
        version: 0,
        signature: '',
        format: '',
        resource_type: '',
        url: '',
        width: 0,
        height: 0,
        secure_url: '',
    };
}

/*
* Uses a before and after snapshot of the images array to find out what images are no longer included
*/
function cleanUp(oldValues, newValues) {
    let oldIds = oldValues.map(function (val) {
        return val.public_id;
    });
    let newIds = newValues.map(function (val) {
        return val.public_id;
    });

    let removedItemsCloudinaryIds = _.difference(oldIds, newIds);
    // We never wait to return on the images being removed
    async.map(removedItemsCloudinaryIds, function (id, next) {
        cloudinary.uploader.destroy(id, function (result) {
            console.log('cloudinaryimagesexpress:cleanup', id, result);
            next();
        });
    });
};

/**
 * cloudinaryimagesexpress FieldType Constructor
 * @extends Field
 * @api public
 */
function cloudinaryimagesexpress(list, path, options) {
    this._underscoreMethods = ['format'];
    this._fixedSize = 'full';
    this._defaultSize = 'full';
    this._properties = ['select', 'selectPrefix', 'autoCleanup', 'folder', 'uploadPreset'];

    this.folder = ('folder' in options) ? options.folder : null;
    this.uploadPreset = ('uploadPreset' in options) ? options.uploadPreset : null;

    // validate cloudinary config
    if (!keystone.get('cloudinary config')) {
        throw new Error('Invalid Configuration\n\n'
            + 'CloudinaryImages fields (' + list.key + '.' + this.path + ') require the "cloudinary config" option to be set.\n\n'
            + 'See http://keystonejs.com/docs/configuration/#services-cloudinary for more information.\n');
    }

    cloudinaryimagesexpress.super_.call(this, list, path, options);
}

cloudinaryimagesexpress.properName = 'CloudinaryImagesExpress';
util.inherits(cloudinaryimagesexpress, FieldType);

/**
 * Gets the folder for videos in this field
 */
cloudinaryimagesexpress.prototype.getFolder = function () {
    var folder = null;

    if (keystone.get('cloudinary folders') || this.options.folder) {
        if (typeof this.options.folder === 'string') {
            folder = this.options.folder;
        } else {
            folder = this.list.path + '/' + this.path;
        }
    }

    return folder;
};

/**
 * Registers the field on the List's Mongoose Schema.
 */
cloudinaryimagesexpress.prototype.addToSchema = function (schema) {

    var cloudinary = require('cloudinary');
    var mongoose = keystone.mongoose;
    var field = this;

    this.paths = {
        // virtuals
        folder: this.path + '.folder',
        // form paths
        upload: this.path + '_upload',
        uploads: this.path + '_uploads',
        action: this.path + '_action',
    };

    var ImageSchema = new mongoose.Schema({
        public_id: String,
        version: Number,
        signature: String,
        format: String,
        resource_type: String,
        url: String,
        width: Number,
        height: Number,
        secure_url: String,
    });

    // Generate cloudinary folder used to upload/select images
    var folder = function (item) { // eslint-disable-line no-unused-vars
        var folderValue = '';

        if (keystone.get('cloudinary folders')) {
            if (field.options.folder) {
                folderValue = field.options.folder;
            } else {
                var folderList = keystone.get('cloudinary prefix') ? [keystone.get('cloudinary prefix')] : [];
                folderList.push(field.list.path);
                folderList.push(field.path);
                folderValue = folderList.join('/');
            }
        }

        return folderValue;
    };

    // The .folder virtual returns the cloudinary folder used to upload/select images
    schema.virtual(field.paths.folder).get(function () {
        return folder(this);
    });

    schema.add(this._path.addTo({}, [ImageSchema]));

    // this.removeImage = function (item, id, method, callback) {
    //     var images = item.get(field.path);
    //     if (typeof id !== 'number') {
    //         for (var i = 0; i < images.length; i++) {
    //             if (images[i].public_id === id) {
    //                 id = i;
    //                 break;
    //             }
    //         }
    //     }
    //     var img = images[id];
    //     if (!img) return;
    //     if (method === 'delete') {
    //         cloudinary.uploader.destroy(img.public_id, function () {
    //         });
    //     }
    //     images.splice(id, 1);
    //     if (callback) {
    //         item.save((typeof callback !== 'function') ? callback : undefined);
    //     }
    // };
    // this.underscoreMethod('remove', function (id, callback) {
    //     field.removeImage(this, id, 'remove', callback);
    // });
    // this.underscoreMethod('delete', function (id, callback) {
    //     field.removeImage(this, id, 'delete', callback);
    // });
    // this.bindUnderscoreMethods();


};


/**
 * Formats the field value
 */
cloudinaryimagesexpress.prototype.format = function (item) {
    console.log('cloudinaryimagesexpress:format');
    return _.map(item.get(this.path), function (img) {
        return img.src();
    }).join(', ');
};

/**
 * Gets the field's data from an Item, as used by the React components
 */
cloudinaryimagesexpress.prototype.getData = function (item) {
    var value = item.get(this.path);
    return Array.isArray(value) ? value : [];
};

/**
 * Validates that a value for this field has been provided in a data object
 *
 * Deprecated
 */
cloudinaryimagesexpress.prototype.inputIsValid = function (data) { // eslint-disable-line no-unused-vars
    // Validation is performed in the updateItem function
    return true;
};


cloudinaryimagesexpress.prototype._originalGetOptions = cloudinaryimagesexpress.prototype.getOptions;

cloudinaryimagesexpress.prototype.getOptions = function () {
    this._originalGetOptions();
    // We are performing the check here, so that if cloudinary secure is added
    // to keystone after the model is registered, it will still be respected.
    // Setting secure overrides default `cloudinary secure`
    if ('secure' in this.options) {
        this.__options.secure = this.options.secure;
    } else if (keystone.get('cloudinary secure')) {
        this.__options.secure = keystone.get('cloudinary secure');
    }
    return this.__options;
};

/**
 * Updates the value for this field in the item from a data object
 */
cloudinaryimagesexpress.prototype.updateItem = function (item, data, files, callback) {

    let field = this,
        values = this.getValueFromData(data),
        oldValues = item.get(this.path);


    //If value is undefined carry on
    if (typeof(values) === "undefined"){
        return process.nextTick(callback);
    }

    // Parse JSON
    try {
        values = JSON.parse(values);
    }
    catch (e) {
        return callback({message: "Invalid Format", error: e});
    }

    // When the value exists, but isn't an array return an error
    if (!Array.isArray(values)) {
        return callback({message: "Invalid Array. No array was supplied", invalidValue: values});
    }

    // Loop through and validate/clean photo data
    let sanitisedValues = [],
        invalidValues = [];

    for (let photo, i = 0; i < values.length; i++) {
        photo = values[i];
        if (photo.hasOwnProperty('public_id') && typeof(photo.public_id) === "string" && photo.public_id !== "") {
            sanitisedValues.push(assign(getEmptyValue(), values[i]));
        }
        else {
            invalidValues.push(values[i])
        }
    }

    if (invalidValues.length) {
        return callback({message: "Invalid. Entries did not meet validation", invalid: invalidValues});
    }
    else {
        if (field.options.autoCleanup) {
            cleanUp(oldValues, sanitisedValues);
        }
        item.set(field.path, sanitisedValues);
        return callback();
    }

};

module.exports = cloudinaryimagesexpress;
