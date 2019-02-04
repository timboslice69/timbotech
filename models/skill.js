var keystone = require('keystone'),
    Types = keystone.Field.Types;

var Skill = new keystone.List('Skill', {
    autokey: {path: 'slug', from: 'name', unique: true},
    defaultSort: '-name',
    defaultColumns: 'name',
    track: true,
    label: 'Skills'
});

Skill.add({
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
    content: {
        type: Types.Markdown,
        label: 'Content',
    }
});

Skill.schema.virtual("permalink").get(function () {
    return "/skill/" + this.slug;
});

Skill.relationship({
    path: 'related_skillset', // Local path name for relationship
    ref: 'Skillset', // Other Type with relationship to this Type
    refPath: 'related_skills' // Path on the other Type
});

Skill.register();
