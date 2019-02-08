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
        type: Types.MarkdownPlus,
        label: 'Content',
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
        label: 'Gallery',
        folder: 'service',
        uploadPreset: "zfxzmcnc",
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
