var keystone = require('keystone'),
    cache = require('express-cache-headers'),
    middleware = require('./middleware'),
    apiMiddleware = require('./apiMiddleware'),
    compression = require('compression'),
    async = require('async'),
    importRoutes = keystone.importer(__dirname);

// Common Middleware
function parallel(middlewares) {
    return function (req, res, next) {
        async.each(middlewares, function (mw, cb) {
            mw(req, res, cb);
        }, next);
    };
}

keystone.pre('routes', parallel([
    middleware.initErrorHandlers,
    middleware.initMeta,
    middleware.initLocals,
    middleware.initAssets,
    middleware.initGlobals,
]));

// Load Routes
var routes = {
    views: importRoutes('./views'),
    api: importRoutes('./api')
};

// Bind Routes
exports = module.exports = function(app) {
    // Apply compression to all requests
    app.use(compression());
    app.use(cache({ttl: 365 * 24 * 60 * 60}));

    // Views
    app.get('/', routes.views.index);
    app.get('/projects/:slug', routes.views.project);
    app.get('/client-types/:slug', routes.views.clientType);
    app.get('/work-method/:slug', routes.views.workMethod);

    // API
    app.use('/api', cache({private: true, ttl:  3600}));
    app.use('/api', apiMiddleware.authenticate);
};
