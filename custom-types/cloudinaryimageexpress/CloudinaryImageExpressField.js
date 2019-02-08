import React, {PropTypes} from 'react';
import Field from '../Field';
import {Button, FormField, FormInput, FormNote} from '../../../admin/client/App/elemental';
import ImageThumbnail from '../../components/ImageThumbnail';
import HiddenFileInput from '../../components/HiddenFileInput';
import cloudinaryUrl from 'cloudinary-microurl';


const SUPPORTED_TYPES = ['image/*'];
const SUPPORTED_REGEX = new RegExp(/^image\//g);

const CLOUD_NAME = window.Keystone.cloudinary.cloud_name;
const cloudinaryCloudName = CLOUD_NAME;

let uploadInc = 1000;

let defaultThumbnailHeight = 150;

let globalStyles = {
    imageThumbnail: {
        position: 'relative',
        display: 'inline-block',
        verticalAlign: 'top',
        margin: '0 10px 10px 0'
    },
    imageThumbnailImage: {
        height: defaultThumbnailHeight + 'px',
        width: 'auto'
    },
    uploadButton: {
        fontSize: '36px',
        textAlign: 'center',
        top: 0,
        left: 0,
        width: (defaultThumbnailHeight * 1.5) + 'px',
        height: defaultThumbnailHeight + 'px',
        lineHeight: defaultThumbnailHeight + 'px',
        background: 'transparent'
    },
    cancelButton: {
        position: 'absolute',
        bottom: 0,
        right: '4px',
        fontWeight: 'bold',
        fontSize: '12px',
        lineHeight: '18px',
        background: 'transparent',
        padding: '0',
        border: 'none',
        outline: 'none'
    },
    deleteButton: {
        position: 'absolute',
        top: '8px',
        right: '8px',
        fontWeight: 'bold',
        fontSize: '16px',
        lineHeight: '20px',
        opacity: '0.75',
        borderRadius: '0.3rem'
    },
    uploadProgress: {
        display: 'inline-block',
        width: '65%',
        verticalAlign: 'middle',
        marginRight: '5px'
    },
    uploadContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        padding: '4px',
        boxSizing: 'border-box'
    },
    uploadContainerInner: {
        position: 'relative',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
    },
    progressStyle: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        width: '100%',
        textAlign: 'center',
        height: '18px',
        lineHeight: '18px',
        backgroundColor: 'rgba(255,255,255,.25)',
        fontSize: '12px'
    },
    progressTextStyle: {
        position: 'relative',
        zIndex: 1,
        color: '#fff',
        textShadow: '0 1px 1px #333'
    }
};


const buildInitialState = (props) => ({
    removedExisting: false,
    uploadFieldPath: `CloudinaryImageExpress-${props.path}-${++uploadInc}`,
    userSelectedFile: null,
    uploading: false,
    uploadingError: false,
    uploadProgress: 0,
    value: props.value,
    fileInputDisabled: false,
    xhr: new XMLHttpRequest(),
    cloudinaryUploadPreset: props.uploadPreset,
    cloudinaryUploadFolder: props.folder
});

module.exports = Field.create({
    propTypes: {
        collapse: PropTypes.bool,
        label: PropTypes.string,
        note: PropTypes.string,
        path: PropTypes.string.isRequired,
        value: PropTypes.shape({
            format: PropTypes.string,
            height: PropTypes.number,
            public_id: PropTypes.string,
            resource_type: PropTypes.string,
            secure_url: PropTypes.string,
            signature: PropTypes.string,
            url: PropTypes.string,
            version: PropTypes.number,
            width: PropTypes.number,
        }),
    },
    displayName: 'CloudinaryImageExpressField',
    statics: {
        type: 'CloudinaryImageExpress',
        getDefaultValue: () => ({})
    },
    getInitialState() {
        return buildInitialState(this.props);
    },
    componentWillReceiveProps(nextProps) {
        //console.log('CloudinaryImageExpressField nextProps:', nextProps);
    },
    componentWillUpdate(nextProps) {
        if (this.props.value.public_id !== nextProps.value.public_id) {
            this.setState({
                userSelectedFile: null,
            });
        }
    },
    // ==============================
    // HELPERS
    // ==============================
    hasLocal() {
        return !!this.state.userSelectedFile;
    },
    hasExisting() {
        return !!(this.state.value && this.state.value.url);
    },
    isUploading() {
        return this.hasLocal() && this.state.uploading;
    },
    hasUploadError() {
        return this.state.uploadError;
    },
    hasRemovedExisting() {
        return this.state.removedExisting;
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
    // ==============================
    // METHODS
    // ==============================
    triggerFileBrowser() {
        this.refs.fileInput.clickDomNode();
    },
    handleImageChange(e) {
        if (!window.FileReader) {
            return alert('File reader not supported by browser.');
        }

        let component = this,
            reader = new FileReader(),
            file = e.target.files[0];

        if (!file) return;

        if (!file.type.match(SUPPORTED_REGEX)) {
            return alert('Unsupported file type. Supported MIME types are ' + SUPPORTED_TYPES);
        }

        reader.onloadstart = () => {
            component.setState({
                loading: true,
            });
        };
        reader.onloadend = (event) => {
            file.dataUri = event.target.result;
            file.uploadPercent = 0;
            component.setState({
                loading: false,
                userSelectedFile: file,
            });
            component.clearFileInput();
            component.uploadFile(file);
        };

        reader.readAsDataURL(file);
    },
    enableFileInput() {
        this.setState({fileInputDisabled: false})
    },
    disableFileInput() {
        this.setState({fileInputDisabled: true})
    },
    clearFileInput(){
        this.refs.fileInput.clearValue();
    },
    resetFileInput() {
        this.setState({userSelectedFile: null, fileInputDisabled: false})
    },
    handleRemove() {
        this.setState({value: "", removedExisting: true});
        this.resetFileInput();
    },
    stringifyValue() {
        return (this.state.value === "") ? this.state.value : JSON.stringify(this.state.value);
    },
    cancelFileUpload() {
        this.state.xhr.abort();
        this.setState({
            userSelectedFile: null,
            uploading: false,
            uploadingPercent: 0
        });
        // Reset xhr
        this.state.xhr = new XMLHttpRequest();
    },
    uploadFile(file) {
        var url = `https://api.cloudinary.com/v1_1/${cloudinaryCloudName}/upload`;
        var fd = new FormData();
        var component = this;

        component.state.xhr.open('POST', url, true);
        component.state.xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');

        // Update progress (can be used to show progress indicator)
        this.state.xhr.upload.addEventListener("progress", function (e) {
            file.uploadPercent = Math.round((e.loaded * 100.0) / e.total);
            component.setState({uploadPercent: file.uploadPercent});
        });

        this.state.xhr.onreadystatechange = function (e) {
            if (component.state.xhr.readyState === 4)
                if (component.state.xhr.status === 200) {
                    let response = JSON.parse(component.state.xhr.responseText);
                    component.setState({value: response, userSelectedFile: null, uploading: false, uploadPercent: 0});
                }
                else {
                    component.setState({uploading: true, uploadError: true});
                }
        };

        fd.append('upload_preset', this.state.cloudinaryUploadPreset);
        fd.append('folder', this.state.cloudinaryUploadFolder);
        fd.append('file', file);
        component.setState({uploading: true, uploadError: false, uploadPercent: 0});
        component.state.xhr.send(fd);
    },
    // ==============================
    // RENDERERS
    // ==============================
    renderImageDeleteButton() {
        return (
            <button type="button" style={globalStyles.deleteButton} onClick={this.handleRemove}>x</button>
        )
    },
    renderImageThumbnail() {
        let image = this.state.value;
        let width = image.width * (defaultThumbnailHeight / image.height);
        return (
            <ImageThumbnail component="span" style={globalStyles.imageThumbnail}>
                <img src={this.getImageThumbnailSource(image, defaultThumbnailHeight)}
                     style={{height: defaultThumbnailHeight, background: '#ddd'}} height={defaultThumbnailHeight} width={width}/>
                {this.renderImageDeleteButton()}
            </ImageThumbnail>
        );
    },
    renderImageUpload() {
        return (
            <ImageThumbnail component="span" style={globalStyles.imageThumbnail}>
                {this.renderImageUploadButton()}
            </ImageThumbnail>
        );
    },
    renderImageUploadButton() {
        return (
            <button type="button" onClick={this.triggerFileBrowser} style={globalStyles.uploadButton}>+</button>
        );
    },
    renderCancelUploadButton() {
        return (
            <button type="button" style={globalStyles.cancelButton} onClick={this.cancelFileUpload}>x</button>
        )
    },
    renderFileInput() {
        return (
            <HiddenFileInput accept={SUPPORTED_TYPES.join()} ref="fileInput" name={this.state.uploadFieldPath}
                             onChange={this.handleImageChange} disabled={this.state.fileInputDisabled}/>
        );
    },
    renderImageInput() {
        return (
            <input name={this.getInputName(this.props.path)} type="hidden" value={this.stringifyValue()} />
        );
    },
    renderProgressBar(uploadPercent) {
        let progressPercentStyle = {
            width: uploadPercent + '%',
            backgroundColor: '#3ec54a',
            position: 'absolute',
            height: '100%',
            top: '0px',
            left: '0px'
        };
        if (!this.isUploading()) {
            return null;
        }
        else {
            return (
                <div className="progress" style={globalStyles.progressStyle}>
                    <span style={globalStyles.progressTextStyle}>{uploadPercent}%</span>
                    <span style={progressPercentStyle}></span>
                </div>
            );
        }
    },
    renderUploadError() {
        let style = {
            position: 'relative',
            textAlign: 'center',
            height: '2em',
            lineHeight: '2em',
            backgroundColor: '#ff9c9c',
            borderRadius: '0.3rem',
            margin: '5px 0',
            overflow: 'hidden'
        };
        return (
            <div className="uploadError" style={style}>
                <span>Upload Error</span>
                {this.renderCancelUploadButton()}
            </div>
        );
    },
    renderUploadPreview(file) {
        return (
            <ImageThumbnail component="span" style={globalStyles.imageThumbnail}>
                <img src={file.dataUri} style={globalStyles.imageThumbnailImage}/>
                <div style={globalStyles.uploadContainer}>
                    <div style={globalStyles.uploadContainerInner}>
                        <div style={globalStyles.uploadProgress}>
                            {this.renderProgressBar(file.uploadPercent)}
                        </div>
                    </div>
                </div>
            </ImageThumbnail>
        )
    },
    renderUploadingContainer() {
        let uploadPreview = this.renderUploadPreview(this.state.userSelectedFile);
        return (uploadPreview);
    },
    renderUI() {
        const {label, path} = this.props;
        return (
            <FormField label={label} htmlFor={path}>
                {this.hasExisting() && this.renderImageThumbnail()}
                {this.hasLocal() && this.renderUploadingContainer()}
                {!this.isUploading() && !this.hasExisting() && this.renderImageUpload()}
                {this.hasUploadError() && this.renderUploadError()}
                {this.renderFileInput()}
                {this.renderImageInput()}
            </FormField>
        );
    },
});
