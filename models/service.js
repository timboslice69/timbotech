var keystone = require('keystone'),
    Types = keystone.Field.Types;

var Service = new keystone.List('Service', {
    autokey: {path: 'slug', from: 'name', unique: true},
    defaultSort: '-name',
    defaultColumns: 'name',
    track: true,
    label: 'Services'
});

Service.add({
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
});

Service.schema.virtual("permalink").get(function () {
    return "/service/" + this.slug;
});

Service.relationship({
    path: 'related_projects', // Local path name for relationship
    ref: 'Project', // Other Type with relationship to this Type
    refPath: 'related_services' // Path on the other Type
});

Service.register();
