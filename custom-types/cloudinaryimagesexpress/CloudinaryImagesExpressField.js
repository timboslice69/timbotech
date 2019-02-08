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
let xhr = new XMLHttpRequest();
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
        color: '#333',
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
    uploadFieldPath: `CloudinaryImagesExpress-${props.path}-${++uploadInc}`,
    userSelectedFile: null,
    userSelectedFiles: [],
    uploadingFileIndex: 0,
    uploading: false,
    uploadingError: false,
    uploadProgress: 0,
    loadingFiles: false,
    value: props.value,
    fileInputDisabled: false,
    cloudinaryUploadPreset: props.uploadPreset,
    cloudinaryUploadFolder: props.folder
});

const cloudinaryImagePropType = PropTypes.shape({
    format: PropTypes.string,
    height: PropTypes.number,
    public_id: PropTypes.string,
    resource_type: PropTypes.string,
    secure_url: PropTypes.string,
    signature: PropTypes.string,
    url: PropTypes.string,
    version: PropTypes.number,
    width: PropTypes.number,
});

module.exports = Field.create({
    propTypes: {
        collapse: PropTypes.bool,
        label: PropTypes.string,
        note: PropTypes.string,
        path: PropTypes.string.isRequired,
        value: PropTypes.arrayOf(cloudinaryImagePropType),
    },
    displayName: 'CloudinaryImagesExpressField',
    statics: {
        type: 'CloudinaryImagesExpress',
        getDefaultValue: () => ({})
    },
    getInitialState() {
        return buildInitialState(this.props);
    },
    componentWillReceiveProps(nextProps) {
        //console.log('CloudinaryImagesExpressField nextProps:', nextProps);
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
        return !!(this.state.userSelectedFiles && (this.state.userSelectedFiles.length > 0));
    },
    hasExisting() {
        return !!(this.state.value && this.state.value.length);
    },
    hasVideo() {
        return this.hasExisting() || this.hasLocal();
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
    handleImagesChange(e) {
        if (!window.FileReader) {
            return alert('File reader not supported by browser.');
        }

        let component = this,
            userSelectedFiles = this.state.userSelectedFiles,
            files = e.target.files,
            validFiles = [],
            invalidFiles = [];

        if (!files || !files.length) {
            return;
        }

        this.setState({loadingFiles: true});

        for (let file, i = 0; i < files.length; i++) {
            file = files[i];
            if (!file.type.match(SUPPORTED_REGEX)) {
                invalidFiles.push(file);
            }
            else {
                validFiles.push(file)
            }
        }

        if (invalidFiles.length > 0) {
            alert('Unsupported file types. ' + invalidFiles.length + ' files cannot be uploaded as they are the wrong type');
        }

        let readyIndex = 0;
        validFiles.forEach(function (file) {
            let reader = new FileReader();
            reader.addEventListener("loadend", function (event) {
                file.dataUri = event.target.result;
                file.uploadPercent = 0;
                userSelectedFiles.push(file);
                component.setState({userSelectedFiles: userSelectedFiles});
                readyIndex++;
                if (readyIndex === (validFiles.length)) {
                    component.startUploading();
                    component.setState({loadingFiles: false});
                    component.resetFileInput();
                }
            }, false);
            reader.readAsDataURL(file);
        });
    },
    startUploading() {
        if (this.isUploading()) return;
        this.setState({uploading: true, uploadingFileIndex: 0});
        this.uploadNextFile()
    },
    uploadNextFile() {
        let component = this,
            files = component.state.userSelectedFiles;

        if (files.length > 0) {
            component.uploadFile(
                files[0],
                function () {
                    component.removeUploadedFile();
                    component.uploadNextFile();
                }
            );
        }
        else {
            this.finishUploading()
        }
    },
    finishUploading() {
        this.setState({uploading: false, uploadingFileIndex: 0, userSelectedFiles: []});
    },
    enableFileInput() {
        this.setState({fileInputDisabled: false});
    },
    disableFileInput() {
        this.setState({fileInputDisabled: true});
    },
    resetFileInput() {
        this.refs.fileInput.clearValue();
        this.setState({fileInputDisabled: false});
    },
    stringifyValue() {
        return (this.state.value === "") ? this.state.value : JSON.stringify(this.state.value);
    },
    cancelFileUpload() {
        xhr.abort();
        let state = {
            userSelectedFile: null,
            uploading: false,
            uploadingPercent: 0
        };
        this.setState(state);
        // Reset xhr
        xhr = new XMLHttpRequest();
    },
    addFileToCollection(response) {
        this.state.value.push(response);
        this.setState({value: this.state.value});
    },
    removeUploadedFile() {
        this.state.userSelectedFiles.splice(0, 1);
        this.setState({userSelectedFiles: this.state.userSelectedFiles});
    },
    uploadFile(file, callback) {
        let url = `https://api.cloudinary.com/v1_1/${cloudinaryCloudName}/upload`,
            fd = new FormData(),
            component = this;

        xhr.open('POST', url, true);
        xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');

        // Update progress (can be used to show progress indicator)
        xhr.upload.addEventListener("progress", function (e) {
            file.uploadPercent = Math.round((e.loaded * 100.0) / e.total);
            component.setState({uploadPercent: file.uploadPercent});
        });

        xhr.onreadystatechange = function (event) {
            if (xhr.readyState === 4)
                if (xhr.status === 200) {
                    let response = JSON.parse(xhr.responseText);
                    component.addFileToCollection(response);
                    if (callback) callback.call();
                }
                else {
                    component.setState({uploading: true, uploadError: true});
                }
        };

        fd.append('upload_preset', this.state.cloudinaryUploadPreset);
        fd.append('folder', this.state.cloudinaryUploadFolder);
        fd.append('file', file);
        component.setState({uploading: true, uploadError: false, uploadPercent: 0});
        xhr.send(fd);
    },
    deleteImage(public_id) {
        let images = this.state.value,
            imageIndex;

        for (let i = 0; i < images.length; i++) {
            if (images[i].public_id === public_id) {
                imageIndex = i;
                break;
            }
        }

        if (imageIndex >= 0) images.splice(imageIndex, 1);
        this.setState({value: images});
    },
    renderImageDeleteButton(image) {
        let component = this,
            deleteFunction = function(){
                component.deleteImage(image.public_id);
        };
        return (
            <button type="button" style={globalStyles.deleteButton} onClick={deleteFunction}>x</button>
        )
    },
    renderImageThumbnail(image) {
        let width = image.width * (defaultThumbnailHeight / image.height);
        return (
            <ImageThumbnail key={image.public_id} component="span" style={globalStyles.imageThumbnail}>
                <img src={this.getImageThumbnailSource(image, defaultThumbnailHeight)}
                     style={{height: defaultThumbnailHeight, background: '#ddd'}} height={defaultThumbnailHeight} width={width}/>
                {this.renderImageDeleteButton(image)}
            </ImageThumbnail>
        );
    },
    renderImageThumbnails() {
        const images = this.state.value;
        const imagePreviews = images.map((image) => {
                return this.renderImageThumbnail(image)
            }
        );
        return (imagePreviews);
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
                             multiple="true" onChange={this.handleImagesChange}
                             disabled={this.state.fileInputDisabled}/>
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
                <span>Upload Error (Click Cancel Upload)</span>
            </div>
        );
    },

    renderUploadPreview(file, key) {
        return (
            <ImageThumbnail component="span" style={globalStyles.imageThumbnail} key={key}>
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
        let files = this.state.userSelectedFiles;
        let uploadPreviews = files.map(this.renderUploadPreview);
        return (uploadPreviews);
    },

    renderUI() {
        const {label, path} = this.props;
        return (
            <FormField label={label} htmlFor={path}>
                {this.hasExisting() && this.renderImageThumbnails()}
                {this.renderUploadingContainer()}
                {this.renderImageUpload()}
                {this.renderFileInput()}
                {this.renderImageInput()}
            </FormField>
        );
    },
});
