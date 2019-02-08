var keystone = require('keystone'),
    Types = keystone.Field.Types;

var Article = new keystone.List('Article', {
    autokey: {path: 'slug', from: 'name', unique: true},
    defaultSort: '-name',
    defaultColumns: 'name',
    track: true,
    label: 'Articles'
});

Article.add({
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
        height: 300
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
    media: {
        video: {
            type: Types.CloudinaryVideo,
            label: "Video",
        },
        video_poster: {
            type: Types.CloudinaryImageExpress,
            label: "Video Poster Image"
        },
    },
    related_client_types: {
        type: Types.Relationship,
        ref: "ClientType",
        many: true
    },
    related_projects: {
        type: Types.Relationship,
        ref: "Project",
        many: true
    },
    related_skillsets: {
        type: Types.Relationship,
        ref: "Skillset",
        many: true
    },
    related_work_methods: {
        type: Types.Relationship,
        ref: "WorkMethod",
        many: true
    },
});

Article.schema.virtual("permalink").get(function () {
    return "/articles/" + this.slug;
});

Article.register();
