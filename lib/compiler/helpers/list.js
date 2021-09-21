var _ = require('lodash');
var Element = require('../../render/element');

module.exports = function(compiler) {
  compiler.registerHelper('list', function(options) {
    var container = 'ul';
    _.keys(options.hash).forEach(function(key) {
      if (key === 'numbered' && options.hash['numbered']) {
        container = 'ol';
      } else {
        element[key] = options.hash[key];
      }
    });
    var element = new Element(container);
    element.content = options.transclude();
    return element;
  });
};
