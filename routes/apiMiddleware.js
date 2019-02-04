exports = module.exports = {

    authenticate: function(req, res, next) {
        // you could check user permissions here too
        if (req.user) return next();
        return res.status(401).end();
    }

}