var keystone = require('keystone');

// Bind Routes
exports = module.exports = function(app) {
    app.all('/api*', function(req, res){
        res.end("{}");
    });
};
