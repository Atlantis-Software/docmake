var _ = require('lodash');

module.exports = function(compiler) {
  compiler.registerHelper('table', function(options) {
    var element = {
      table: {
        body: options.transclude()
      }
    };
    _.keys(options.hash).forEach(function(key) {
      if (key === 'layout') {
        element['layout'] = options.hash['layout'];
      } else {
        element.table[key] = options.hash[key];
      }
    });
    return element;
  });
};
