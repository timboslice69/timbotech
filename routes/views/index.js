let keystone = require('keystone');

exports = module.exports = function (req, res) {

    let view = new keystone.View(req, res),
        locals = res.locals;

    view.on('init', function (next) {
        // Load your data here
        next()
    });

    view.render('views/index');
};
