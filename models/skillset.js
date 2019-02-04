var keystone = require('keystone'),
    Types = keystone.Field.Types;

var Skillset = new keystone.List('Skillset', {
    autokey: {path: 'slug', from: 'name', unique: true},
    defaultSort: '-name',
    defaultColumns: 'name',
    track: true,
    label: 'Skillsets'
});

Skillset.add({
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
    related_skills: {
        type: Types.Relationship,
        ref: "Skill",
        many: true,
        createInline: true
    }
});

Skillset.schema.virtual("permalink").get(function () {
    return "/skillset/" + this.slug;
});

Skillset.relationship({
    path: 'related_clients', // Local path name for relationship
    ref: 'Client', // Other Type with relationship to this Type
    refPath: 'related_skillsets' // Path on the other Type
});

Skillset.relationship({
    path: 'related_projects', // Local path name for relationship
    ref: 'Project', // Other Type with relationship to this Type
    refPath: 'related_skillsets' // Path on the other Type
});

Skillset.register();
