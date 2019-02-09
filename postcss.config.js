module.exports = {
    map: true,
    plugins: [
        require('postcss-import')({}),
        require('postcss-url')({
            url: 'copy',
            assetsPath: '',
            useHash: false
        })
    ]
};