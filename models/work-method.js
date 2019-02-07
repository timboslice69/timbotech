var keystone = require('keystone'),
    Types = keystone.Field.Types;

var WorkMethod = new keystone.List('WorkMethod', {
    autokey: {path: 'slug', from: 'name', unique: true},
    defaultSort: '-name',
    defaultColumns: 'name',
    track: true,
    label: 'Working Methods'

});

WorkMethod.add({
    status: {
        type: Types.Select,
        options: 'draft, published, archived',
        default: 'draft',
        index: true
    },
    name: {
        type: Types.Text,
        required: true,
        initial: true,
        index: true,
        label: 'Name'
    },
    introduction: {
        type: Types.Markdown,
        label: 'Introduction',
    },
    content: {
        type: Types.Markdown,
        label: 'Content',
    }
    // ,
    // permalink: {
    //     type: Types.Text,
    //     label: 'Permalink',
    //     note: 'Automatically generated',
    //     canEdit: false
    // }
},
    );

// Cant use a virtual permalink because a long chain of
// clusterfudges in keystone that wont renter virtuals in admin ui api calls
WorkMethod.schema.virtual("permalink").get(function () {
    return "/working/" + this.slug;
});

WorkMethod.schema.set('toObject', { virtuals: true });
WorkMethod.schema.set('toJSON', { virtuals: true });

WorkMethod.register();
