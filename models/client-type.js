var keystone = require('keystone'),
    Types = keystone.Field.Types;

var ClientType = new keystone.List('ClientType', {
    autokey: {path: 'slug', from: 'name', unique: true},
    defaultSort: '-name',
    defaultColumns: 'name',
    track: true,
    label: 'Client Types'
});

ClientType.add({
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
    },
    related_skillsets: {
        type: Types.Relationship,
        ref: "Skillset",
        many: true
    }
});

ClientType.schema.virtual("permalink").get(function () {
    return "/clients/" + this.slug;
});

ClientType.relationship({
    path: 'related_clients', // Local path name for relationship
    ref: 'Client', // Other Type with relationship to this Type
    refPath: 'client_type' // Path on the other Type
});

ClientType.relationship({
    path: 'related_projects', // Local path name for relationship
    ref: 'Project', // Other Type with relationship to this Type
    refPath: 'related_client_type' // Path on the other Type
});

ClientType.register();
