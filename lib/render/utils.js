var _ = require('lodash');

module.exports = {
  parseDimension: function(reference, dimension) {
    if (_.isString(dimension)) {
      if (dimension.endsWith('%')) {
        var percent = parseFloat(dimension.slice(0, -1));
        if (_.isNaN(percent)) {
          return reference;
        }
        return reference * percent / 100;
      } else {
        var num = parseFloat(dimension);
        if (!_.isNaN(num)) {
          return num;
        } else {
          return reference;
        }
      }
    } else if (_.isNumber(dimension)) {
      return dimension;
    }
    return reference;
  }
};
