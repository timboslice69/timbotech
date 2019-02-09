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
    tagline: {
        type: Types.Text,
        label: 'Tag Line'
    },
    logo: {
        type: Types.CloudinaryImageExpress,
        label: 'Site Logo',
        folder: "site",
        uploadPreset: "zfxzmcnc",
    },
    introduction: {
        type: Types.MarkdownPlus,
        label: 'Introduction',
        linkLists: [{
            model: 'ClientType',
            urlPath: 'permalink',
            titlePath: 'name'
        },
            {
                model: 'WorkMethod',
                urlPath: 'permalink',
                titlePath: 'name'
            }]
    },
    content: {
        type: Types.MarkdownPlus,
        label: 'Content',
        linkLists: [{
            model: 'Article',
            urlPath: 'permalink',
            titlePath: 'name'
        },
        {
            model: 'ClientType',
            urlPath: 'permalink',
            titlePath: 'name'
        },
        {
            model: 'Project',
            urlPath: 'permalink',
            titlePath: 'name'
        },
        {
            model: 'WorkMethod',
            urlPath: 'permalink',
            titlePath: 'name'
        },
        {
            model: 'Service',
            urlPath: 'permalink',
            titlePath: 'name'
        },
        {
            model: 'Skillset',
            urlPath: 'permalink',
            titlePath: 'name'
        }]
    },
    copyright: {
        type: Types.Text,
        label: 'Copyright notice'
    },
    contact: {
        email:  {
            type: Types.Email,
            label: 'Email Address'
        },
        wechat:  {
            type: Types.Text,
            label: 'WeChat'
        },
        wechat_qr: {
            type: Types.CloudinaryImageExpress,
            label: 'WeChat QR Code',
            folder: "site",
            uploadPreset: "zfxzmcnc",
        },
        linkedin:  {
            type: Types.Text,
            label: 'LinkedIn'
        },
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
