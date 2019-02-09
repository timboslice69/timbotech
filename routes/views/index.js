let keystone = require('keystone'),
    Project = keystone.list('Project');

exports = module.exports = function (req, res) {

    let view = new keystone.View(req, res),
        locals = res.locals;


    function getProjects() {
        return new Promise(function (resolve, reject) {
            Project.model
                .find({status: 'published'})
                .select('name permalink summary hero_image')
                .exec()
                .then(resolve)
                .catch(reject);
        });
    }

    view.on('init', function (next) {

        getProjects().then(function(results){
            locals.projects = results;
            next();
        });

    });

    view.render('views/index');
};
