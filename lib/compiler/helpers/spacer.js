var _ = require('lodash');
var Element = require('../../render/element');

module.exports = function(compiler) {
  compiler.registerHelper('vspace', function(space, options) {
    var element = new Element('vspace');
    element.width = 0;
    element.height = space;
    element.lineEnd = true;
    _.keys(options.hash).forEach(function(key) {
      element[key] = options.hash[key];
    });
    return element;
  });
  compiler.registerHelper('hspace', function(space, options) {
    var element = new Element('hspace');
    element.width = space;
    element.height = 0;
    _.keys(options.hash).forEach(function(key) {
      element[key] = options.hash[key];
    });
    return element;
  });
};
