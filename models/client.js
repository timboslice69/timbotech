var keystone = require('keystone'),
    Types = keystone.Field.Types;

var Client = new keystone.List('Client', {
    autokey: {path: 'slug', from: 'name', unique: true},
    defaultSort: '-name',
    defaultColumns: 'name',
    track: true,
    label: 'Clients'
});

Client.add({
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
    client_type: {
        type: Types.Relationship,
        ref: "ClientType",
        many: false
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

Client.schema.virtual("permalink").get(function () {
    return "/client/" + this.slug;
});

Client.relationship({
    path: 'related_projects', // Local path name for relationship
    ref: 'Project', // Other Type with relationship to this Type
    refPath: 'related_client' // Path on the other Type
});

Client.register();
