import Field from '../Field';
import { Fields } from 'FieldTypes';
import React from 'react';
import {FormInput, Modal, Button} from '../../../admin/client/App/elemental';
import {listsByKey, listsByPath} from '../../../admin/client/utils/lists';
import Select from 'react-select';

console.log(listsByKey, listsByPath);

/**
 * TODO:
 * - Remove dependency on jQuery
 */

// Scope jQuery and the bootstrap-markdown editor so it will mount
var $ = require('jquery');
require('./lib/bootstrap-markdown');

// Append/remove ### surround the selection
// Source: https://github.com/toopay/bootstrap-markdown/blob/master/js/bootstrap-markdown.js#L909
var toggleHeading = function (e, level) {
    var chunk;
    var cursor;
    var selected = e.getSelection();
    var content = e.getContent();
    var pointer;
    var prevChar;

    if (selected.length === 0) {
        // Give extra word
        chunk = e.__localize('heading text');
    } else {
        chunk = selected.text + '\n';
    }

    // transform selection and set the cursor into chunked text
    if ((pointer = level.length + 1, content.substr(selected.start - pointer, pointer) === level + ' ')
        || (pointer = level.length, content.substr(selected.start - pointer, pointer) === level)) {
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

var insertLink = function (e, url, text) {
    var chunk,
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
var renderMarkdown = function (component) {
    // dependsOn means that sometimes the component is mounted as a null, so account for that & noop
    if (!component.refs.markdownTextarea) {
        return;
    }

    var options = {
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
        reorderButtonGroups: [ 'groupPlus', 'groupHeaders', 'groupFont',  'groupMisc', 'groupUtil']
    };

    if (component.props.toolbarOptions.hiddenButtons) {
        var hiddenButtons = (typeof component.props.toolbarOptions.hiddenButtons === 'string')
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
            modalOpen: false,
            selectedLinkListKey: '',
            selectedLinkTargetValue: '',
            selectedLinkTargetLabel: '',
            linkListOptions: [],
            linkLists: {}
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

    loadLinkListOptions(inputValue, callback){
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

                for (let i=0; i<items.length; i++) {
                    options.push({
                        value: items[i].fields[urlPath],
                        label: items[i].fields[titlePath]
                    });
                }

                callback(null, { options: options, complete: true });
            }
            else callback([]);
        });
    },

    onInsertLink(markdownController) {
        this.markdownController = markdownController;
        this.setState({modalOpen: true});
    },

    onModalCancel() {
        this.resetLinkListModal();
    },

    onModalClose() {
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
            modalOpen: false
        });
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

    showLinkTargetSelect(){
        return this.state.selectedLinkListKey !== '';
    },

    renderLinkTargetSelect(selectStyle){
         return (
            <Select.Async
                loadOptions={this.loadLinkListOptions}
                onChange={this.onSelectLinkTargetChange}
                value={this.state.selectedLinkTargetValue}
                style={selectStyle}
            />
        )
    },

    renderLinkListModal() {
        let labelStyle = {
            display: "inline-block",
            verticalAlign: "top",
            width: "20%",
            color: "#7F7F7F",
            fontSize: "1rem",
            fontWeight: "normal",
            lineHeight: "2.3em",
            marginBottom: "0",
            paddingRight: "5px"
        };

        let selectStyle = {
            display: "inline-block",
            verticalAlign: "top",
            width: "70%"
        };

        let containerStyle = {
            padding: "1em 0"
        };

        let modalStyle = {
            height: "80%"
        };

        //todo: find a better workaround for dealing with modal overflow and height, subclass it perhaps
        return (
            <div>
                <style dangerouslySetInnerHTML={{__html: `
                  div[data-screen-id="modal-dialog"] { overflow-y: visible; }
                `}} />
                <Modal.Dialog
                    isOpen={this.state.modalOpen}
                    onClose={this.onModalClose}
                    backdropClosesModal
                    style={modalStyle}
                    className="modal-overflow-override"
                >
                    <Modal.Header
                        text={'Insert a link'}
                    />
                    <Modal.Body>
                        <div style={containerStyle}>
                            <label style={labelStyle}>Link Type</label>
                            <span style={selectStyle}>
                                <Select
                                    options={this.state.linkListOptions}
                                    onChange={this.onSelectLinkListChange}
                                    value={this.state.selectedLinkListKey}
                                    style={selectStyle}
                                />
                            </span>
                        </div>
                        <div style={containerStyle}>
                            <label style={labelStyle}>Link Target</label>
                            <span style={selectStyle}>
                                {this.showLinkTargetSelect() && this.renderLinkTargetSelect(selectStyle)}
                            </span>
                        </div>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button color="success" type="button" data-button-type="close" onClick={this.onLinkSubmit}>
                            Insert
                        </Button>
                        <Button
                            variant="link"
                            color="cancel"
                            data-button-type="cancel"
                            onClick={this.onModalCancel}
                        >
                            Cancel
                        </Button>
                    </Modal.Footer>
                </Modal.Dialog>
            </div>
        );
    },

    renderField() {
        const styles = {
            padding: 8,
            height: this.props.height,
        };
        const defaultValue = (this.props.value !== undefined && this.props.value.md !== undefined) ? this.props.value.md : '';

        return (
            <div>
                {this.renderLinkListModal()}
                <textarea
                    className="md-editor__input code"
                    defaultValue={defaultValue}
                    name={this.getInputName(this.props.paths.md)}
                    ref="markdownTextarea"
                    style={styles}
                />
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
            <FormInput
                dangerouslySetInnerHTML={{__html: innerHtml}}
                multiline
                noedit
            />
        );
    }
    ,
});
