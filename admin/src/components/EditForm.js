var _ = require('underscore'),
	moment = require('moment'),
	React = require('react'),
	Fields = require('../fields'),
	FormHeading = require('./FormHeading'),
	Toolbar = require('./Toolbar'),
	InvalidFieldType = require('./InvalidFieldType');

var EditForm = React.createClass({
	
	displayName: 'EditForm',
	
	getInitialState: function() {
		return {
			values: _.clone(this.props.data.fields)
		};
	},
	
	getFieldProps: function(field) {
		var props = _.clone(field);
		props.value = this.state.values[field.path];
		props.values = this.state.values;
		props.onChange = this.handleChange;
		props.mode = 'edit';
		return props;
	},
	
	handleChange: function(event) {
		var values = this.state.values;
		values[event.path] = event.value;
		this.setState({
			values: values
		});
	},
	
	renderNameField: function() {
		
		var namePath = this.props.list.namePath,
			nameField = this.props.list.nameField,
			nameIsEditable = this.props.list.nameIsEditable;
		
		function wrapNameField(field) {
			return (
				<div className="field item-name">
					<div className="col-sm-12">
						{field}
					</div>
				</div>
			);
		}
		
		if (nameIsEditable) {
			
			var nameFieldProps = this.getFieldProps(nameField);
			nameFieldProps.className = 'item-name-field';
			nameFieldProps.placeholder = nameField.label;
			nameFieldProps.label = false;
			
			return wrapNameField(
				React.createElement(Fields[nameField.type], nameFieldProps)
			);
			
		} else if (nameField && nameField.type == 'name') {
			var nameValue = this.props.data.fields[nameField.path] || {};
			nameValue = _.compact([nameValue.first, nameValue.last]).join(' ');
			return wrapNameField(
				<h2 className="form-heading name-value">{nameValue || '(no name)'}</h2>
			);
		} else {
			return wrapNameField(
				<h2 className="form-heading name-value">{this.props.data.fields[namePath] || '(no name)'}</h2>
			);
		}
	},
	
	renderTrackingMeta: function() {
		
		if (!this.props.list.tracking) return null;
		
		var elements = {},
			data = {},
			label;
		
		if (this.props.list.tracking.createdAt) {
			data.createdAt = this.props.data.fields[this.props.list.tracking.createdAt];
			if (data.createdAt) {
				elements.createdAt = (
					<div className="item-details-meta-item">
						<span className="item-details-meta-label">Created</span>
						<span className="item-details-meta-info">{moment(data.createdAt).format('Do MMM YY h:mm:ssa')}</span>
					</div>
				);
			}
		}
		
		if (this.props.list.tracking.createdBy) {
			data.createdBy = this.props.data.fields[this.props.list.tracking.createdBy];
			if (data.createdBy) {
				label = data.createdAt ? 'by' : 'Created by';
				// todo: harden logic around user name
				elements.createdBy = (
					<div className="item-details-meta-item">
						<span className="item-details-meta-label">{label}</span>
						<span className="item-details-meta-info">{data.createdBy.name.first} {data.createdBy.name.last}</span>
					</div>
				);
			}
		}
		
		if (this.props.list.tracking.updatedAt) {
			data.updatedAt = this.props.data.fields[this.props.list.tracking.updatedAt];
			if (data.updatedAt && (!data.createdAt || data.createdAt !== data.updatedAt)) {
				elements.updatedAt = (
					<div className="item-details-meta-item">
						<span className="item-details-meta-label">Updated</span>
						<span className="item-details-meta-info">{moment(data.updatedAt).format('Do MMM YY h:mm:ssa')}</span>
					</div>
				);
			}
		}
		
		if (this.props.list.tracking.updatedBy) {
			data.updatedBy = this.props.data.fields[this.props.list.tracking.updatedBy];
			if (data.updatedBy && (!data.createdBy || data.createdBy.id !== data.updatedBy.id || elements.updatedAt)) {
				label = data.updatedAt ? 'by' : 'Created by';
				elements.updatedBy = (
					<div className="item-details-meta-item">
						<span className="item-details-meta-label">{label}</span>
						<span className="item-details-meta-info">{data.updatedBy.name.first} {data.updatedBy.name.last}</span>
					</div>
				);
			}
		}
		
		return Object.keys(elements).length ? <div className="item-details-meta">{elements}</div> : null;
		
	},

	renderPreviewButton: function() {

		var prevOpt = this.props.list.preview,
			autokeyPath = this.props.list.autokey.path,
			keyValue = this.props.data[autokeyPath],
			context = $.extend({ id: this.props.data.id, key: keyValue }, this.props.data.fields);
			label = 'View ' + this.props.list.key,
			path = '';
		
		function runInContext (fn) {
			fn = new Function("return "+fn)();
			return fn.call(context);
		}

		// handle complex config
		if(typeof prevOpt == 'object') {
			
			if(prevOpt.available.indexOf('function') === 0 && runInContext(prevOpt.available) === false) {
				return null;
			}
			if(prevOpt.label) {
				label = prevOpt.label;
			}
			if(prevOpt.path) {
				path = prevOpt.path;
			}
		} else {
			// only path (string or fn)
			path = prevOpt;
		}

		if(path.indexOf('function') === 0) {
			path = runInContext(path);
		} else {
			path = path.replace(':key', keyValue);
		}

		return <a className="btn btn-preview" href={path} target="_blank">{label}</a>;
	},
	
	renderFormElements: function() {
		
		var elements = {},
			headings = 0;
		
		_.each(this.props.list.uiElements, function(el) {
			
			if (el.type === 'heading') {
				
				headings++;
				el.options.values = this.state.values;
				elements['h-' + headings] = React.createElement(FormHeading, el);
				
			} else if (el.type === 'field') {
				
				var field = this.props.list.fields[el.field];
				
				if ('function' !== typeof Fields[field.type]) {
					elements[field.path] = React.createElement(InvalidFieldType, { type: field.type, path: field.path });
					return;
				}
				
				elements[field.path] = React.createElement(Fields[field.type], this.getFieldProps(field));
				
			}
			
		}, this);
		
		return elements;
		
	},
	
	renderToolbar: function() {
		
		var toolbar = {};
		
		if (!this.props.list.noedit) {
			toolbar.save = <button type="submit" className="btn btn-save">Save</button>;
		}

		if (this.props.list.preview) {
			toolbar.preview = this.renderPreviewButton();
		}
		
		if (!this.props.list.noedit && !this.props.list.nodelete) {
			// TODO: Confirm: Use React & Modal
			toolbar.del = <a href={'/keystone/' + this.props.list.path + '?delete=' + this.props.data.id + Keystone.csrf.query} className="btn btn-link btn-cancel delete" data-confirm={"Are you sure you want to delete this " + this.props.list.singular.toLowerCase()}>delete {this.props.list.singular.toLowerCase()}</a>;
		}

		if (!this.props.list.noedit) {
			// TODO: Confirm: Use React & Modal
			toolbar.reset = <a href={'/keystone/' + this.props.list.path + '/' + this.props.data.id} className="btn btn-link btn-cancel"  data-confirm="Are you sure you want to reset your changes?">reset changes</a>;
		}

		return (
			<Toolbar>
				{toolbar}
			</Toolbar>
		);
		
	},
	
	render: function() {
		
		return (
			<form method="post" encType="multipart/form-data" className="item-details">
				<input type="hidden" name="action" value="updateItem" />
				<input type="hidden" name={Keystone.csrf.key} value={Keystone.csrf.value} />
				{this.renderNameField()}
				{this.renderTrackingMeta()}
				{this.renderFormElements()}
				{this.renderToolbar()}
			</form>
		);
	}
	
});

module.exports = EditForm;
