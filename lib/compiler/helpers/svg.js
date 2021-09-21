var _ = require('lodash');
var Element = require('../../render/element');

module.exports = function(compiler) {
  compiler.registerHelper('svg', function(svg, options) {
    if (arguments.length !== 2) {
      throw new Error('svg tag require one argument');
    }
    var element = new Element('svg');
    element.content = svg;
    _.keys(options.hash).forEach(function(key) {
      element[key] = options.hash[key];
    });
    return element;
  });
};
