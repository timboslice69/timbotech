let keystone = require('keystone'),
    WorkMethod = keystone.list('WorkMethod');

exports = module.exports = function (req, res) {

    let view = new keystone.View(req, res),
        locals = res.locals;


    function getWorkMethod(slug) {
        return new Promise(function (resolve, reject) {
            WorkMethod.model
                .findOne({slug: slug})
                .populate('')
                .exec()
                .then(resolve)
                .catch(reject);
        });
    }

    view.on('init', function (next) {

        let slug = req.params.slug;

        getWorkMethod(slug).then(function(result){
            locals.workMethod = result;
            next();
        });

    });

    view.render('views/work-method');
};
