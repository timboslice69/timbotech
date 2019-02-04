import React from 'react';
import ItemsTableCell from '../../components/ItemsTableCell';
import ItemsTableValue from '../../components/ItemsTableValue';

var CloudinaryVideoColumn = React.createClass({
	displayName: 'CloudinaryVideoColumn',
	propTypes: {
		col: React.PropTypes.object,
		data: React.PropTypes.object,
	},
	renderValue: function () {
		let value = this.props.data.fields[this.props.col.path],
            style = {
		        width: '100%',
                height: 'auto'
            };

		console.log('fields', this.props.data.fields);

		if (!value || !Object.keys(value).length) return;

		return (
			<ItemsTableValue field={this.props.col.type}>
                <video src={value.secure_url} style={style} controls muted>
                    <source src={value.secure_url} />
                </video>
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

module.exports = CloudinaryVideoColumn;
