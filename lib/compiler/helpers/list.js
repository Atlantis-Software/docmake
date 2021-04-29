var _ = require('lodash');

module.exports = function(compiler) {
  compiler.registerHelper('list', function(options) {
    var element = {};
    var container = 'ul';
    _.keys(options.hash).forEach(function(key) {
      if (key === 'numbered' && options.hash['numbered']) {
        container = 'ol';
      } else {
        element[key] = options.hash[key];
      }
    });
    element[container] = options.transclude();
    return element;
  });
};
