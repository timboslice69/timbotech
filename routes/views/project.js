let keystone = require('keystone'),
    Project = keystone.list('Project');

exports = module.exports = function (req, res) {

    let view = new keystone.View(req, res),
        locals = res.locals;


    function getProject(slug) {
        return new Promise(function (resolve, reject) {
            Project.model
                .findOne({slug: slug})
                .populate('related_client_type related_client related_skillsets related_services')
                .exec()
                .then(resolve)
                .catch(reject);
        });
    }

    view.on('init', function (next) {

        let slug = req.params.slug;

        getProject(slug).then(function(result){
            locals.project = result;
            next();
        });

    });

    view.render('views/project');
};
