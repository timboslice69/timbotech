var path = require('path');
var fs = require('fs');

const { COPYFILE_FICLONE } = fs.constants;

module.exports = {
    // copy directory
// register type

    register: function(name, dir, keystone){
        console.log('Register-Custom-Type:', name, dir);
        // test path
        var keystonePath = path.resolve('node_modules/keystone/fields/types'),
            fullPath = path.resolve(dir),
            typeFile = path.resolve(dir, name+'Field.js'),
            customKeystonePath = path.resolve(keystonePath, name.toLowerCase()),
            allowedFileSuffix = ['Type', 'Field', 'Column', 'Filter', 'Thumbnail'];

        function define(){
            console.log('Register-Custom-Type: Defining keystone property', customKeystonePath + '/' + name + 'Type');

            // add type
            Object.defineProperty(keystone.Field.Types, name, {
                get: function() { return require(customKeystonePath + '/' + name + 'Type'); }
            });
        }

        if (!fs.existsSync(fullPath) || !fs.existsSync(typeFile) || !fs.existsSync(keystonePath)){
            //console.log('Register-Custom-Type: Invalid Path - aborting', fullPath, typeFile, keystonePath);
        }

        // copy to keystone
        // check if directory already exists if not make new directory
        //console.log('Register-Custom-Type: Creating New Path', customKeystonePath);

        if (!fs.existsSync(customKeystonePath)) {
            fs.mkdirSync(customKeystonePath);
        }

        //loop through files and copy
        var files = fs.readdirSync(fullPath);

        // get files to copy
        for (var from, to, data, suffix, filename, i = 0; i < files.length; i++){
            filename = files[i];
            suffix = filename.replace(name, '').replace('.js', '');
            if (allowedFileSuffix.indexOf(suffix) > -1) {
                from = path.resolve(fullPath, filename);
                to = path.resolve(customKeystonePath, filename);
                //fs.copyFileSync(from, to); // Copy file sync is corrupting files for some reason so using read and write methods below.
                data = fs.readFileSync(from, 'utf-8');
                fs.writeFileSync(to, data);
                //console.log('Register-Custom-Type: Copied file', from, to)
            }
        }


        define();

    }
};