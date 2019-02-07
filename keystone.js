// Simulate config options from your production environment by
// customising the .env file in your project's root folder.
require('dotenv').config();

var keystone = require('keystone'),
    express = require('express'),
    postcssMiddleware = require('postcss-middleware'),
	handlebars = require('express-handlebars'),
    expressApp = express();

//Register Custom Types
var customTypes = require('./custom-types/register-custom-type');
customTypes.register('CloudinaryImageExpress', 'custom-types/cloudinaryimageexpress', keystone);
customTypes.register('CloudinaryImagesExpress', 'custom-types/cloudinaryimagesexpress', keystone);
customTypes.register('CloudinaryVideo', 'custom-types/cloudinaryvideo', keystone);
customTypes.register('MarkdownPlus', 'custom-types/markdownplus', keystone);

keystone.init({
	'name': 'Timbo Slice - Creative Technology',
	'brand': 'Timbo Slice',

	'static': 'public',
    'static options': {
        //lastModified: true,
        //maxAge: 365 * 24 * 60 * 60 * 1000
    },
	'views': 'templates',
	'view engine': '.hbs',

	'custom engine': handlebars.create({
		layoutsDir: 'templates/layouts',
		partialsDir: 'templates/partials',
		defaultLayout: 'default',
		helpers: new require('./templates/helpers')(),
		extname: '.hbs',
	}).engine,

	'auto update': true,
	'session': true,
    'session store': 'mongo',
	'auth': true,
	'user model': 'User',

    'wysiwyg cloudinary images': true
});

keystone.import('models');


keystone.set('locals', {
	_: require('lodash'),
	env: keystone.get('env'),
	utils: keystone.utils,
	editable: keystone.content.editable,
});
keystone.set('routes', require('./routes'));
keystone.set('cloudinary prefix', 'timbotech');
keystone.set('cloudinary folders', true);
keystone.set('cloudinary secure', true);
//
// keystone.set('nav', {
//     articles: 'articles',
//     clients: ['clients', 'client-types'],
//     projects: 'projects',
//     skills: ['skills', 'skillsets'],
//     'work-methods': 'work-methods'
// });



//keystone.app = expressApp;
keystone.start();
