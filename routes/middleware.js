var keystone = require('keystone'),
    Site = keystone.list('Site');

/**
 * Initialise the site meta data
 * @param req
 * @param res
 * @param next
 */
exports.initMeta = function (req, res, next) {
    let locals = res.locals;

    locals.meta = {
        title: '',
        description: '',
        keywords: [],
    };

    locals.meta.makeTitle = function (pageTitle) {
        locals.meta.title = (pageTitle ? pageTitle + " | " : "") + locals.site.name;
    };
    locals.meta.clearKeywords = function () {
        locals.meta.keywords = [];
    };
    locals.meta.addKeywords = function (newKeywords) {
        if (typeof newKeywords === "string") {
            newKeywords = newKeywords.split(',');
        }
        if (typeof newKeywords === "object" && !newKeywords.hasOwnProperty('length')) {
            var tmp = [];
            for (var prop in newKeywords) {
                if (newKeywords.hasOwnProperty(prop) && typeof newKeywords[prop] === "string" && newKeywords[prop] !== "") {
                    tmp.push(prop, newKeywords[prop]);
                }
            }
            newKeywords = tmp;
        }
        locals.meta.keywords = locals.meta.keywords.concat(newKeywords);
    };

    next();
};

/**
 Initialises the standard view locals.
 Include anything that should be initialised before route controllers are executed.
 */
exports.initLocals = function (req, res, next) {
    var locals = res.locals;
    // Add user
    locals.user = req.user;
    // Add requested url
    locals.requestUrl = req.url;
    // Setup Navigation
    locals.navigation = {
        title: undefined,
        url: undefined
    };
    // Get global site config
    Site.model.find().limit(1).exec(function (error, result) {
        if (!error && result && result.length > 0) {
            locals.site = result[0];
            locals.title = locals.site.name;
            locals.meta.description = locals.site.seo.description;
            locals.meta.addKeywords(locals.site.seo.keywords);
        }
        next(error);
    });

};

/**
 * Initialise Assets (scripts and stylesheets)
 * @param req
 * @param res
 * @param next
 */
exports.initAssets = function (req, res, next) {
    var locals = res.locals;

    locals.head = {
        stylesheets: [],
        scripts: []
    };

    locals.head.addStylesheet = function (url) {
        if (locals.head.stylesheets.indexOf(url) < 0) {
            locals.head.stylesheets.push(url);
        }
    };

    locals.head.addScript = function (url) {
        if (locals.head.scripts.indexOf(url) < 0) {
            locals.head.scripts.push(url);
        }
    };

    next();
};

/**
 * Initialise error handling functions
 * @param req
 * @param res
 * @param next
 */
exports.initErrorHandlers = function (req, res, next) {

    res.error = function (error, title, message) {
        res.status(500).render('errors/500', {
            error: error,
            errorTitle: title,
            errorMessage: message
        });
    };

    res.notfound = function (title, message) {
        res.status(404).render('errors/404', {
            errorTitle: title,
            errorMessage: message
        });
    };

    res.notAuthorized = function (title, message) {
        res.status(401).end();
    };

    res.notAllowed = function (allowedMethods) {
        res.status(405).set('Allow', allowedMethods).end();
    };

    next();
};
