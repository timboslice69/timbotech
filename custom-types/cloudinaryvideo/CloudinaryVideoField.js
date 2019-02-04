import React, {PropTypes} from 'react';
import Field from '../Field';
import {Button, FormField, FormInput} from 'elemental';
import HiddenFileInput from '../../components/HiddenFileInput';

const SUPPORTED_TYPES = ['video/*', 'application/pdf', 'application/postscript'];
const SUPPORTED_REGEX = new RegExp(/^video\/|application\/pdf|application\/postscript/g);

let uploadInc = 1000;

let xhr = new XMLHttpRequest();

const buildInitialState = (props) => ({
    removedExisting: false,
    uploadFieldPath: `CloudinaryVideo-${props.path}-${++uploadInc}`,
    userSelectedFile: null,
    uploading: false,
    uploadingError: false,
    uploadProgress: 0,
    value: props.value,
    fileInputDisabled: false,
    retrievingVideos: false,
    videos: []
});

module.exports = Field.create({
    propTypes: {
        label: PropTypes.string,
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
    displayName: 'CloudinaryVideoField',
    statics: {
        type: 'CloudinaryVideo',
        getDefaultValue: () => ({})
    },
    getInitialState() {
        // Not fetching videos because Keystone Cloudinary Api is still shitty
        //this.getVideos();
        return buildInitialState(this.props);
    },
    componentWillReceiveProps(nextProps) {
        //console.log('CloudinaryVideoField nextProps:', nextProps);
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
    getFilename() {
        return this.state.userSelectedFile ? this.state.userSelectedFile.name : '';
    },
    getVideoProperties() {
        return this.state.value;
    },
    getVideoSource(height = 90) {
        let src;
        if (this.hasLocal()) {
            src = this.state.dataUri;
        } else if (this.hasExisting()) {
            src = this.state.value.url
        }
        return src;
    },
    /* Not yest Used as the built in cloudinary api doesn't handle using next_cursor*/
    getVideos() {
        let url = this.props.cloudinaryApiEndpoint;
        let component = this;
        let xhr = new XMLHttpRequest();
        let maxRequests = 10;
        let requestCount = 0;

        function retrieve(next_cursor){
            component.setState({retrievingVideos: true});
            requestCount++;
            if (requestCount >= maxRequests) return;
            xhr.open('GET', url + '?next_cursor=' + next_cursor, true);
            xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
            xhr.send();
        }

        xhr.onreadystatechange = function (e) {
            if (xhr.readyState === 4)
                if (xhr.status === 200) {
                    let response = JSON.parse(xhr.responseText);

                    if (response.item) response = response.item;
                    else return;

                    let newVideos = response.resources.filter(function(resource){
                        return resource.resource_type === "video";
                    });

                    component.setState({videos: component.state.videos.concat(newVideos)});
                    if (response.next_cursor &&  response.next_cursor !== "")  {
                        retrieve(response.next_cursor);
                    }
                }
                else {
                    component.setState({ retrievingVideos: false, retrieveError: true });
                }
        };

        xhr.upload.addEventListener("progress", function (e) {
            //component.setState({ uploadPercent: Math.round((e.loaded * 100.0) / e.total) });
            //console.log(`fileuploadprogress data.loaded: ${e.loaded}, data.total: ${e.total}`);
        });

        retrieve('');


    },
    // ==============================
    // METHODS
    // ==============================
    triggerFileBrowser() {
        this.refs.fileInput.clickDomNode();
    },

    handleFileChange(event) {
        const userSelectedFile = event.target.files[0];
        this.setState({userSelectedFile});
    },

    // Handle video selection in file browser
    handleVideoChange(e) {
        if (!window.FileReader) {
            return alert('File reader not supported by browser.');
        }
        var reader = new FileReader();
        var file = e.target.files[0];
        if (!file) return;

        if (!file.type.match(SUPPORTED_REGEX)) {
            return alert('Unsupported file type. Supported formats are: MPG, MP2, MP4, MPEG, MPEG2, MPEG4, MOV, OGG');
        }

        reader.readAsDataURL(file);

        reader.onloadstart = () => {
            this.setState({
                loading: true,
            });
        };
        reader.onloadend = (upload) => {
            this.setState({
                dataUri: upload.target.result,
                loading: false,
                userSelectedFile: file,
            });

            this.uploadFile(file);
        };
    },
    enableFileInput() {
        this.setState({fileInputDisabled: false})
    },
    disableFileInput() {
        this.setState({fileInputDisabled: true})
    },
    resetFileInput() {
        this.setState({userSelectedFile: null, fileInputDisabled: false})
    },
    handleRemove(e) {
        this.setState({value: "", removedExisting: true});
        this.resetFileInput();
    },
    stringifyValue() {
        return (this.state.value === "") ? this.state.value : JSON.stringify(this.state.value);
    },
    cancelFileUpload() {
        xhr.abort();
        var state = {
            userSelectedFile: null,
            uploading: false,
            uploadingPercent: 0
        };
        this.setState(state);
        // Reset xhr
        xhr = new XMLHttpRequest();
    },
    uploadFile(file) {
        var url = `https://api.cloudinary.com/v1_1/${this.props.cloudinaryName}/upload`;
        var fd = new FormData();
        var component = this;
        xhr.open('POST', url, true);
        xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');

        // Reset the upload progress bar
        //document.getElementById('progress').style.width = 0;

        // Update progress (can be used to show progress indicator)
        xhr.upload.addEventListener("progress", function (e) {
            component.setState({uploadPercent: Math.round((e.loaded * 100.0) / e.total)});
            //console.log(`fileuploadprogress data.loaded: ${e.loaded}, data.total: ${e.total}`);
        });

        xhr.onreadystatechange = function (e) {
            if (xhr.readyState == 4)
                if (xhr.status == 200) {
                    // Success
                    var response = JSON.parse(xhr.responseText);
                    console.log(response);
                    component.setState({value: response, userSelectedFile: null, uploading: false, uploadPercent: 0});
                    // Reset the file input after upload
                    //this.refs.fileInput.value = '';
                }
                else {
                    //error
                    //console.log('ERROR', e);
                    component.setState({uploading: true, uploadError: true});
                }
        };

        fd.append('upload_preset', this.props.cloudinaryPreset);
        fd.append('resource_type', 'video');
        fd.append('file', file);
        component.setState({uploading: true, uploadError: false, uploadPercent: 0});
        xhr.send(fd);
    },

    renderVideoProperties() {
        let props = this.getVideoProperties();
        return (
            <div>
                <small>
                    <strong>Size:</strong> {props.width}x{props.height}
                    <strong>Duration:</strong> {props.duration}s <strong>Format:</strong> {props.format}
                    <strong>FPS:</strong> {props.frame_rate}<br/>
                    <strong>URL:</strong> <a target="_blank" href={props.url}>{props.url}</a>
                </small>
            </div>
        );
    },

    renderVideoPreview() {
        const {value} = this.props;
        return (
            <div>
                <video src={this.getVideoSource()} controls style={{width: '100%', height: "auto"}}/>
                {this.renderVideoProperties()}
            </div>
        );
    },

    renderExistingVideoToolbar() {
        let style = {
            margin: '1em 0 0 0'
        };

        return (
            <div key={this.props.path + '_toolbar'} style={style} className="video-toolbar">
                <Button variant="link" color="delete" onClick={this.handleRemove}>Remove Video</Button>
            </div>
        );
    },

    renderNoVideoToolbar() {
        return (
            <div key={this.props.path + '_toolbar'} className="video-toolbar">
                <Button onClick={this.triggerFileBrowser}>Upload Video</Button>
            </div>
        );
    },

    renderFileInput() {
        if (!this.shouldRenderField()) return null;
        return (
            <HiddenFileInput accept={SUPPORTED_TYPES.join()} ref="fileInput" name={this.state.uploadFieldPath}
                             onChange={this.handleVideoChange} disabled={this.state.fileInputDisabled}/>
        );
    },

    renderVideoInput() {
        if (!this.shouldRenderField()) return null;
        return (
            <input name={this.getInputName(this.props.path)} type="hidden" value={this.stringifyValue()}
                   onChange={this.doNothing}/>
        );
    },

    renderProgressBar() {
        let percentComplete = this.state.uploadPercent;
        let progressStyle = {
            position: 'relative',
            textAlign: 'center',
            height: '2.4em',
            lineHeight: '2.4em',
            backgroundColor: '#cccccc',
            borderRadius: '0.3rem',
            margin: '5px 0',
            overflow: 'hidden'
        };
        let percentStyle = {
            width: percentComplete + '%',
            backgroundColor: '#3ec54a',
            position: 'absolute',
            height: '100%',
            top: '0px',
            left: '0px'
        };
        let textStyle = {
            position: 'relative',
            zIndex: 1
        };
        if (!this.isUploading()) {
            return null;
        }
        else {
            return (
                <div className="progress" style={progressStyle}>
                    <span style={textStyle}>Uploading {percentComplete}%</span>
                    <span style={percentStyle}></span>
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

    renderVideosContainer() {
        let videosList = this.state.videos.map(function(video){
            return <li>{video.secure_url}</li>;
        });
        return (
            <ul>{videosList}</ul>
        )
    },

    renderUploadingContainer() {
        let buttonStyle = {
            display: 'inline-block',
            width: '30%',
            verticalAlign: 'middle'
        };
        let progressStyle = {
            display: 'inline-block',
            width: '65%',
            verticalAlign: 'middle',
            marginRight: '5px'
        };
        return (
            <div className="uploadContainer">
                <video src={this.getVideoSource()} controls style={{width: '100%', height: "auto"}}/>
                <small><strong>Uploading:</strong> {this.getFilename()}</small>
                <br/>
                <div style={progressStyle}>
                    {this.hasUploadError() ? this.renderUploadError() : this.renderProgressBar()}
                </div>
                <Button style={buttonStyle} variant="link" data-button-type="cancel" onClick={this.cancelFileUpload}>Cancel
                    Upload</Button>
            </div>
        );
    },

    renderUI() {
        const {label, path} = this.props;
        return (
            <FormField label={label} className="field-type-cloudinaryvideo" htmlFor={path}>
                {this.isUploading() && this.renderUploadingContainer()}
                {!this.hasExisting() && !this.isUploading() && this.renderNoVideoToolbar()}
                {this.hasExisting() && this.renderVideoPreview()}
                {this.hasExisting() && this.renderExistingVideoToolbar()}
                {this.renderFileInput()}
                {this.renderVideoInput()}
            </FormField>
        );
    },
});
