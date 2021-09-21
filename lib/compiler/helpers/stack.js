var _ = require('lodash');
var Element = require('../../render/element');

module.exports = function(compiler) {
  compiler.registerHelper('stack', function(options) {
    var element = new Element('stack');
    element.content = options.transclude();
    _.keys(options.hash).forEach(function(key) {
      element[key] = options.hash[key];
    });
    return element;
  });
};
