var keystone = require('keystone'),
    Types = keystone.Field.Types;

var ClientType = new keystone.List('ClientType', {
    autokey: {path: 'slug', from: 'name', unique: true},
    defaultSort: '-name',
    defaultColumns: 'name',
    track: true,
    label: 'Client Types',
    schema: {
        toObject: {
            virtuals: true
        },
        toJSON: {
            virtuals: true
        }
    }
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
        type: Types.MarkdownPlus,
        label: 'Content',
        height: 800,
        linkLists: [{
            model: 'ClientType',
            urlPath: 'permalink',
            titlePath: 'name'
        },
            {
                model: 'WorkMethod',
                urlPath: 'permalink',
                titlePath: 'name'
            },
            {
                model: 'Project',
                urlPath: 'permalink',
                titlePath: 'name'
            },
            {
                model: 'Skillset',
                urlPath: 'permalink',
                titlePath: 'name'
            }],
        imageGallery: {
            path: 'gallery',
        }
    },
    gallery: {
        type: Types.CloudinaryImagesExpress,
        folder: "articles",
        uploadPreset: "zfxzmcnc",
        autoCleanup : true,
        label: "Photos & Images",
        note: "Upload the photos and images"
    },
    related_skillsets: {
        type: Types.Relationship,
        ref: "Skillset",
        many: true
    }
});

ClientType.schema.virtual("permalink").get(function () {
    return "/client-types/" + this.slug;
});

ClientType.schema.set('toObject', {virtuals: true});
ClientType.schema.set('toJSON', {virtuals: true});

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
