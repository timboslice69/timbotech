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
    },
    content: {
        type: Types.Markdown,
        label: 'Content',
    },
    media: {
        gallery: {
            type: Types.CloudinaryImagesExpress,
            folder: "articles",
            autoCleanup : true,
            label: "Photos & Images",
            note: "Upload the photos and images"
        },
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
