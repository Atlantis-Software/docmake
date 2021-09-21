var _ = require('lodash');
var Element = require('../../render/element');

module.exports = function(compiler) {
  compiler.registerHelper('font', function(fontName, options) {
    if (arguments.length !== 2) {
      throw new Error('font tag require one argument');
    }
    var element = new Element('font');
    element.content = fontName;
    _.keys(options.hash).forEach(function(key) {
      element[key] = options.hash[key];
    });
    return element;
  });
};
