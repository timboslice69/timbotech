import React from 'react';
import ItemsTableCell from '../../components/ItemsTableCell';
import ItemsTableValue from '../../components/ItemsTableValue';
import ImageThumbnail from '../../components/ImageThumbnail';
import cloudinaryUrl from 'cloudinary-microurl';

let defaultThumbnailHeight = 60;
const CLOUD_NAME = window.Keystone.cloudinary.cloud_name;

var CloudinaryImageExpressColumn = React.createClass({
	displayName: 'CloudinaryImageExpressColumn',
	propTypes: {
		col: React.PropTypes.object,
		data: React.PropTypes.object,
	},
    getImageThumbnailSource(image, height = defaultThumbnailHeight) {
        if (!image) return "";
        let public_id = image.public_id,
            src = cloudinaryUrl(public_id, {
                height: height,
                cloud_name: CLOUD_NAME,
                secure: false
            });
        return src.replace(/^(http)(s)?:/i, "");
    },
	renderValue: function () {
		let value = this.props.data.fields[this.props.col.path];
		if (!value || !Object.keys(value).length) return;
		let width = value.width * (defaultThumbnailHeight / value.height);

		let imageThumbnailStyle = {
            position: 'relative',
            display: 'inline-block',
        };

		return (
			<ItemsTableValue field={this.props.col.type}>
                <ImageThumbnail component="span" style={imageThumbnailStyle}>
                    <img src={this.getImageThumbnailSource(value, defaultThumbnailHeight)} style={{height: defaultThumbnailHeight, background: '#ddd'}} height={defaultThumbnailHeight} width={width}/>
                </ImageThumbnail>
			</ItemsTableValue>
	);

	},
	render () {
		return (
			<ItemsTableCell>
				{this.renderValue()}
			</ItemsTableCell>
	);
	},
});

module.exports = CloudinaryImageExpressColumn;
