var keystone = require('keystone'),
    Types = keystone.Field.Types;

var Site = new keystone.List('Site', {
    autokey: {path: 'slug', from: 'name', unique: true},
    defaultSort: '-name',
    defaultColumns: 'name',
    track: true,
    label: 'Site Settings'
});

Site.add({
    name: {
        type: Types.Text,
        required: true,
        initial: true,
        index: true,
        label: 'Site Name'
    },
    logo: {
        type: Types.CloudinaryImageExpress,
        label: 'Site Logo',
    },
    introduction: {
        type: Types.Markdown,
        label: 'Introduction',
    },
    copyright: {
        type: Types.Text,
        label: 'Copyright notice'
    },
    seo: {
        name: {
            label: "SEO: Site Name",
            note: "This name will be shown on social media and in search engines. You can leave this blank and the site name will be used.",
            type: Types.Text
        },
        description: {
            label: "SEO: Description",
            note: "This description will be shown on social media and search engines. You can leave this blank but its better to supply a short description of this website.",
            type: Types.Textarea
        },
        image: {
            type: Types.CloudinaryImageExpress,
            label: "SEO: Image",
            note: "This image is shown on social media and search engines. You can leave this blank and the logo will be used.",
        },
        keywords: {
            label: "SEO: Keywords",
            type: Types.Text,
            note: "Comma separated keywords that are used by search engines to understand this website."
        },
        host: {
            label: "SEO: Default Host",
            note: "This is used to create a canonical link for every page, add the default hostname for this website",
            type: Types.Text
        },
    }
});


Site.register();
