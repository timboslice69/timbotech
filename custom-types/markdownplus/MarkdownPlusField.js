import Field from '../Field';
import {Fields} from 'FieldTypes';
import React from 'react';
import {FormInput, Modal, Button} from '../../../admin/client/App/elemental';
import {listsByKey, listsByPath} from '../../../admin/client/utils/lists';
import Select from 'react-select';
import ImageThumbnail from '../../components/ImageThumbnail';
import cloudinaryUrl from 'cloudinary-microurl';


const CLOUD_NAME = window.Keystone.cloudinary.cloud_name;
/**
 * TODO:
 * - Remove dependency on jQuery
 */

// Scope jQuery and the bootstrap-markdown editor so it will mount
let $ = require('jquery');
require('./lib/bootstrap-markdown');

// Append/remove ### surround the selection
// Source: https://github.com/toopay/bootstrap-markdown/blob/master/js/bootstrap-markdown.js#L909
let toggleHeading = function (e, level) {
    let chunk,
        cursor,
        selected = e.getSelection(),
        content = e.getContent(),
        pointer,
        prevChar;

    if (selected.length === 0) {
        chunk = e.__localize('heading text');
    } else {
        chunk = selected.text + '\n';
    }

    // transform selection and set the cursor into chunked text
    if ((pointer = level.length + 1, content.substr(selected.start - pointer, pointer) === level + ' ') || (pointer = level.length, content.substr(selected.start - pointer, pointer) === level)) {
        e.setSelection(selected.start - pointer, selected.end);
        e.replaceSelection(chunk);
        cursor = selected.start - pointer;
    } else if (selected.start > 0 && (prevChar = content.substr(selected.start - 1, 1), !!prevChar && prevChar !== '\n')) {
        e.replaceSelection('\n\n' + level + ' ' + chunk);
        cursor = selected.start + level.length + 3;
    } else {
        // Empty string before element
        e.replaceSelection(level + ' ' + chunk);
        cursor = selected.start + level.length + 1;
    }
    // Set the cursor
    e.setSelection(cursor, cursor + chunk.length);
};

let insertLink = function (e, url, text) {
    let chunk,
        selected = e.getSelection();

    if (selected.length > 0) {
        text = selected.text
    }
    chunk = '[' + text + '](' + url + ')';

    e.replaceSelection(chunk);
    // Set the cursor
    e.$element.focus();
    e.setSelection(selected.start + 1, selected.start + 1 + text.length);
};

let insertImage = function (e, url) {
    let chunk,
        cursor,
        altText = 'alt text',
        titleText = 'alt text',
        selected = e.getSelection();

    if (selected.length > 0) {
        altText = titleText = selected.text;
    }
    chunk = '![' + altText + '](' + url + ' "'+titleText+'")';
    e.replaceSelection(chunk);

    // Set the cursor
    cursor = selected.start + altText.length + url.length + 6;
    e.$element.focus();
    e.setSelection(cursor, cursor + titleText.length);
};

let renderMarkdown = function (component) {
    // dependsOn means that sometimes the component is mounted as a null, so account for that & noop
    if (!component.refs.markdownTextarea) {
        return;
    }
    let options = {
        autofocus: false,
        savable: false,
        resize: 'vertical',
        height: component.props.height,
        //hiddenButtons: ['Heading'],
        // Heading buttons
        additionalButtons: [
            [{
                name: 'groupPlus',
                data: [{
                    name: 'cmdItemLink',
                    title: 'Link Item',
                    icon: "mce-ico mce-i-link",
                    callback: function (e) {
                        component.onInsertLink(e);
                    }
                },
                {
                    name: 'cmdImageLink',
                    title: 'Link Item',
                    icon: "mce-ico mce-i-image",
                    callback: function (e) {
                        component.onInsertImage(e);
                    }
                }
                ]
            },
                {
                    name: 'groupHeaders',
                    data: [
                        {
                            name: 'cmdH1',
                            title: 'Heading 1',
                            btnText: 'H1',
                            callback: function (e) {
                                toggleHeading(e, '#');
                            },
                        }, {
                            name: 'cmdH2',
                            title: 'Heading 2',
                            btnText: 'H2',
                            callback: function (e) {
                                toggleHeading(e, '##');
                            },
                        }, {
                            name: 'cmdH3',
                            title: 'Heading 3',
                            btnText: 'H3',
                            callback: function (e) {
                                toggleHeading(e, '###');
                            },
                        }, {
                            name: 'cmdH4',
                            title: 'Heading 4',
                            btnText: 'H4',
                            callback: function (e) {
                                toggleHeading(e, '####');
                            },
                        }
                    ],
                }]
        ],
        // Insert Header buttons into the toolbar
        reorderButtonGroups: ['groupPlus', 'groupHeaders', 'groupFont', 'groupMisc', 'groupUtil']
    };

    if (component.props.toolbarOptions.hiddenButtons) {
        let hiddenButtons = (typeof component.props.toolbarOptions.hiddenButtons === 'string')
            ? component.props.toolbarOptions.hiddenButtons.split(',')
            : component.props.toolbarOptions.hiddenButtons;

        options.hiddenButtons = options.hiddenButtons.concat(hiddenButtons);
    }

    $(component.refs.markdownTextarea).markdown(options);
};

// Simple escaping of html tags and replacing newlines for displaying the raw markdown string within an html doc
var escapeHtmlForRender = function (html) {
    return html
        .replace(/\&/g, '&amp;')
        .replace(/\</g, '&lt;')
        .replace(/\>/g, '&gt;')
        .replace(/\n/g, '<br />');
};

module.exports = Field.create({
    getInitialState(props) {
        return {
            imageModalOpen: false,
            linkModalOpen: false,
            selectedLinkListKey: '',
            selectedLinkTargetValue: '',
            selectedLinkTargetLabel: '',
            linkListOptions: [],
            linkLists: {},
            selectedImageUrl: '',
            imageGalleryPath: (this.props.imageGallery && this.props.imageGallery.path) ? this.props.imageGallery.path : false
        };
    },
    markdownController: null,
    displayName: 'MarkdownPlusField',
    statics: {
        type: 'Markdown',
        getDefaultValue: () => ({}),
    },

    initLinkLists() {
        let listDefinitions = this.props.linkLists;
        let linkLists = {},
            linkListOptions = [];

        if (listDefinitions && listDefinitions.length) {
            for (let list, i = 0; i < listDefinitions.length; i++) {
                list = listDefinitions[i];
                linkLists[list.model] = list;
                linkLists[list.model].name = listsByKey[list.model].singular;

                linkListOptions.push({
                    label: listsByKey[list.model].singular,
                    value: list.model
                })
            }
        }
        this.setState({
            linkListOptions: linkListOptions,
            linkLists: linkLists
        });

    },

    loadLinkListOptions(inputValue, callback) {
        let key = this.state.selectedLinkListKey,
            urlPath = this.state.linkLists[key].urlPath,
            titlePath = this.state.linkLists[key].titlePath;

        listsByKey[key].loadItems({
            filters: [],
            columns: [{path: urlPath}, {path: titlePath}]
        }, function (error, result) {
            if (result) {
                let items = result.results,
                    options = [];

                for (let i = 0; i < items.length; i++) {
                    options.push({
                        value: items[i].fields[urlPath],
                        label: items[i].fields[titlePath]
                    });
                }

                callback(null, {options: options, complete: true});
            }
            else callback([]);
        });
    },

    onInsertLink(markdownController) {
        this.markdownController = markdownController;
        this.setState({linkModalOpen: true});
    },

    onLinkModalCancel() {
        this.resetLinkListModal();
    },

    onLinkModalClose() {
        this.resetLinkListModal();
    },

    onLinkSubmit() {
        if (!this.state.selectedLinkTargetValue || this.state.selectedLinkTargetValue === '' || !this.state.selectedLinkTargetLabel || this.state.selectedLinkTargetLabel === '') {
            return;
        }
        insertLink(this.markdownController, this.state.selectedLinkTargetValue, this.state.selectedLinkTargetLabel);
        this.resetLinkListModal();
    },

    onSelectLinkListChange(option) {
        this.setState({selectedLinkListKey: option.value})
    },

    onSelectLinkTargetChange(option) {
        this.setState({
            selectedLinkTargetValue: option.value,
            selectedLinkTargetLabel: option.label
        })
    },

    resetLinkListModal() {
        this.setState({
            selectedLinkListKey: '',
            selectedLinkTargetValue: '',
            selectedLinkTargetLabel: '',
            linkModalOpen: false
        });
    },

    loadGalleryImages(){
        // Not sure if this is the best way to get live data of the object, but if its there why not use it?
        const itemGlobal = window.Keystone.item;
        return (itemGlobal.fields && itemGlobal.fields[this.state.imageGalleryPath]) ? itemGlobal.fields[this.state.imageGalleryPath] : [];
    },

    onInsertImageSubmit() {
        if (!this.state.selectedImageUrl || this.state.selectedImageUrl === '') {
            return;
        }
        insertImage(this.markdownController, this.state.selectedImageUrl);
        this.resetInsertImageModal();
    },

    onInsertImage(markdownController) {
        this.markdownController = markdownController;
        this.setState({imageModalOpen: true});
    },

    onInsertImageModalCancel() {
        this.resetInsertImageModal();
    },

    onInsertImageModalClose() {
        this.resetInsertImageModal();
    },

    resetInsertImageModal() {
        this.setState({
            selectedImageUrl: '',
            imageModalOpen: false
        });
    },

    onImageSelect(){
        console.log(arguments);
    },

    // override `shouldCollapse` to check the markdown field correctly
    shouldCollapse() {
        return this.props.collapse && !this.props.value.md;
    },

    // only have access to `refs` once component is mounted
    componentDidMount() {
        this.initLinkLists();
        if (this.props.wysiwyg) {
            renderMarkdown(this);
        }
    },

    // only have access to `refs` once component is mounted
    componentDidUpdate() {
        if (this.props.wysiwyg) {
            renderMarkdown(this);
        }
    },
    getImageThumbnailSource(image, height = 200) {
        if (!image) return "";
        let public_id = image.public_id,
            src = cloudinaryUrl(public_id, {
                height: height,
                cloud_name: CLOUD_NAME,
                secure: false
            });
        return src.replace(/^(http)(s)?:/i, "");
    },

    renderImageThumbnail(image) {
        let width = image.width * (defaultThumbnailHeight / image.height);
        let selected = this.state.selectedImageUrl === image.secure_url;
        let handleClick = () => {
            this.setState({selectedImageUrl: image.secure_url });
        };
        return (
            <ImageThumbnail key={image.public_id} component="span" style={selected ? globalStyles.imageThumbnailSelected : globalStyles.imageThumbnail} onClick={handleClick}>
                <img src={this.getImageThumbnailSource(image, defaultThumbnailHeight)}
                     style={{height: defaultThumbnailHeight, background: '#ddd'}} height={defaultThumbnailHeight} width={width}/>
            </ImageThumbnail>
        );
    },

    renderImageThumbnails() {
        const images = this.loadGalleryImages();
        const imagePreviews = images.map((image) => {
                return this.renderImageThumbnail(image)
            }
        );
        return (imagePreviews);
    },

    showLinkTargetSelect() {
        return this.state.selectedLinkListKey !== '';
    },

    renderLinkTargetSelect() {
        return (
            <Select.Async loadOptions={this.loadLinkListOptions} onChange={this.onSelectLinkTargetChange} value={this.state.selectedLinkTargetValue}/>
        )
    },

    renderLinkListModal() {
        //todo: find a better workaround for dealing with modal overflow and height, subclass it perhaps
        return (
            <Modal.Dialog isOpen={this.state.linkModalOpen} onClose={this.onLinkModalClose} backdropClosesModal className="modal-overflow-override">
                <Modal.Header text={'Insert a link'}/>
                <Modal.Body>
                    <div style={globalStyles.container}>
                        <label style={globalStyles.label}>Link Type</label>
                        <span style={globalStyles.select}>
                            <Select options={this.state.linkListOptions} onChange={this.onSelectLinkListChange} value={this.state.selectedLinkListKey}/>
                        </span>
                    </div>
                    <div style={globalStyles.container}>
                        <label style={globalStyles.label}>Link Target</label>
                        <span style={globalStyles.select}>{this.showLinkTargetSelect() && this.renderLinkTargetSelect()}</span>
                    </div>
                </Modal.Body>
                <Modal.Footer>
                    <Button color="success" type="button" data-button-type="close" onClick={this.onLinkSubmit}>Insert</Button>
                    <Button variant="link" color="cancel" data-button-type="cancel" onClick={this.onLinkModalCancel}>Cancel</Button>
                </Modal.Footer>
            </Modal.Dialog>
        );
    },

    renderInsertImageModal() {
        return (
            <Modal.Dialog isOpen={this.state.imageModalOpen} onClose={this.onInsertImageModalClose} backdropClosesModal>
                <Modal.Header text={'Insert an Image'}/>
                <Modal.Body>
                    <div style={globalStyles.container}>
                        {this.renderImageThumbnails()}
                     </div>
                </Modal.Body>
                <Modal.Footer>
                    <Button color="success" type="button" data-button-type="close" onClick={this.onInsertImageSubmit}>Insert</Button>
                    <Button variant="link" color="cancel" data-button-type="cancel" onClick={this.onInsertImageModalCancel}>Cancel</Button>
                </Modal.Footer>
            </Modal.Dialog>
        );
    },

    renderField() {
        const styles = {
            padding: 8,
            height: this.props.height,
        };
        const defaultValue = (this.props.value !== undefined && this.props.value.md !== undefined) ? this.props.value.md : '';
        //todo: find a better workaround for dealing with modal overflow and height, subclass it perhaps
        return (
            <div>
                <style dangerouslySetInnerHTML={{__html:
                        `
                        div[data-screen-id="modal-dialog"] { overflow-y: visible; }
                        .md-editor__preview img {max-width:100%;height:auto;}
                        `
                }}/>
                {this.renderInsertImageModal()}
                {this.renderLinkListModal()}
                <textarea className="md-editor__input code" defaultValue={defaultValue} name={this.getInputName(this.props.paths.md)} ref="markdownTextarea" style={styles}/>
            </div>
        );
    },

    renderValue() {
        // We want to render the raw markdown string, without parsing it to html
        // The markdown string *itself* may include html though so we need to escape it first
        const innerHtml = (this.props.value && this.props.value.md)
            ? escapeHtmlForRender(this.props.value.md)
            : '';

        return (
            <FormInput dangerouslySetInnerHTML={{__html: innerHtml}} multiline noedit/>
        );
    },
});


let defaultThumbnailHeight = 150;

const globalStyles = {
    imageThumbnail: {
        position: 'relative',
        display: 'inline-block',
        verticalAlign: 'top',
        margin: '0 10px 10px 0',
        cursor: "pointer"
    },
    imageThumbnailSelected: {
        position: 'relative',
        display: 'inline-block',
        verticalAlign: 'top',
        margin: '0 10px 10px 0',
        borderColor: "#1385e5",
        backgroundColor: '#1385e5'
    },
    imageThumbnailImage: {
        height: defaultThumbnailHeight + 'px',
        width: 'auto'
    },
    label: {
        display: "inline-block",
        verticalAlign: "top",
        width: "20%",
        color: "#7F7F7F",
        fontSize: "1rem",
        fontWeight: "normal",
        lineHeight: "2.3em",
        marginBottom: "0",
        paddingRight: "5px"
    },
    select: {
        display: "inline-block",
        verticalAlign: "top",
        width: "70%"
    },
    container: {
        padding: "1em 0"
    }
};