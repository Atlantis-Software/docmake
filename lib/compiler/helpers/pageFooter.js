var _ = require('lodash');

module.exports = function(compiler) {
  compiler.registerHelper('pageFooter', function(options) {
    var element = {
      pageFooter: options.transclude(),
      class: ['pageFooter']
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
