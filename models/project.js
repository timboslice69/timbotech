var keystone = require('keystone'),
    Types = keystone.Field.Types;

var Project = new keystone.List('Project', {
    autokey: {path: 'slug', from: 'name', unique: true},
    defaultSort: '-name',
    defaultColumns: 'name',
    track: true,
    label: 'Projects'
});

Project.add({
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
    summary: {
        type: Types.Text,
        label: 'Summary'
    },
    hero_image: {
        type: Types.CloudinaryImageExpress,
        folder: "projects",
        uploadPreset: "zfxzmcnc",
        label: "Hero Image"
    },
    introduction: {
        type: Types.Markdown,
        label: 'Introduction',
    },
    ambition: {
        type: Types.Markdown,
        label: 'Ambition',
    },
    ambition_image: {
        type: Types.CloudinaryImageExpress,
        folder: "projects",
        uploadPreset: "zfxzmcnc",
        label: "Ambition Image"
    },
    process: {
        type: Types.Markdown,
        label: 'Process',
    },
    process_image: {
        type: Types.CloudinaryImageExpress,
        folder: "projects",
        uploadPreset: "zfxzmcnc",
        label: "Process Image"
    },
    technology: {
        type: Types.Markdown,
        label: 'Technology',
    },
    technology_image: {
        type: Types.CloudinaryImageExpress,
        folder: "projects",
        uploadPreset: "zfxzmcnc",
        label: "Technology Image"
    },
    outcome: {
        type: Types.Markdown,
        label: 'outcome',
    },
    outcome_image: {
        type: Types.CloudinaryImageExpress,
        folder: "projects",
        uploadPreset: "zfxzmcnc",
        label: "Outcome Image"
    },
    lesson: {
        type: Types.Markdown,
        label: 'lesson',
    },
    media: {
        video: {
            type: Types.CloudinaryVideo,
            label: "Video",
            uploadPreset: "zfxzmcnc",
        },
        video_poster: {
            type: Types.CloudinaryImageExpress,
            label: "Video Poster Image",
            uploadPreset: "zfxzmcnc",
        }
    },
    related_client_type: {
        type: Types.Relationship,
        ref: "ClientType",
        many: false,
        label: "Client Type"
    },
    related_client: {
        type: Types.Relationship,
        ref: "Client",
        many: false,
        label: "Client"
    },
    related_skillsets: {
        type: Types.Relationship,
        ref: "Skillset",
        many: true,
        label: "Skillsets"
    },
    related_services: {
        type: Types.Relationship,
        ref: "Service",
        many: true,
        label: "Services"
    }
});

Project.schema.virtual("permalink").get(function () {
    return "/projects/" + this.slug;
});

Project.relationship({
    path: 'related_articles', // Local path name for relationship
    ref: 'Article', // Other Type with relationship to this Type
    refPath: 'related_projects' // Path on the other Type
});

Project.register();
