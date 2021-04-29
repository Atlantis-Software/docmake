var _ = require('lodash');

module.exports = function(compiler) {
  compiler.registerHelper('pageHeader', function(options) {
    var element = {
      pageHeader: options.transclude(),
      class: ['pageHeader']
    };
    _.keys(options.hash).forEach(function(key) {
      if (key === 'class') {
        if (_.isString(options.hash[key])) {
          element.class.push(options.hash[key]);
        } else if (_.isArray(options.hash[key])) {
          element.class = element.class.concat(options.hash[key]);
        }
      } else {
        element[key] = options.hash[key];
      }
    });
    return element;
  });
};
