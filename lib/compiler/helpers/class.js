var _ = require('lodash');
var Element = require('../../render/element');

module.exports = function(compiler) {
  compiler.registerHelper('class', function(className, options) {
    if (arguments.length !== 2) {
      throw new Error('class tag require one argument');
    }
    var element = new Element('class');
    element.content = className;
    _.keys(options.hash).forEach(function(key) {
      element[key] = options.hash[key];
    });
    return element;
  });
};
