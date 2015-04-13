var React = require('react');

function evalDependsOn(dependsOn, values) {
	if (!_.isObject(dependsOn)) return true;
	var keys = _.keys(dependsOn);
	return (keys.length) ? _.every(keys, function(key) {
		var dependsValue = dependsOn[key],
				fieldValue = values[key];
		if(_.isBoolean(dependsValue)) {
			if(typeof fieldValue == 'object') {
				return dependsValue !== _.isEmpty(fieldValue);
			} else {
				return dependsValue === !!fieldValue;
			}
		}
		var matches = _.isArray(dependsValue) ? dependsValue : [dependsValue];
		return _.contains(matches, fieldValue);
	}, this) : true;
}

module.exports = React.createClass({
	
	displayName: 'FormHeading',
	
	render: function() {
		if (!evalDependsOn(this.props.options.dependsOn, this.props.options.values)) {
			return null;
		}
		return <h3 className="form-heading">{this.props.content}</h3>;
	}
	
});
