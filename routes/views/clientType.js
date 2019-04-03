let keystone = require('keystone'),
    ClientType = keystone.list('ClientType');

exports = module.exports = function (req, res) {

    let view = new keystone.View(req, res),
        locals = res.locals;


    function getClientType(slug) {
        return new Promise(function (resolve, reject) {
            ClientType.model
                .findOne({slug: slug})
                .populate('related_skillsets related_clients')
                .exec()
                .then(resolve)
                .catch(reject);
        });
    }

    view.on('init', function (next) {

        let slug = req.params.slug;

        getClientType(slug).then(function(result){
            locals.clientType = result;
            next();
        });

    });

    view.render('views/client-type');
};
