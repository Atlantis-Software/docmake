var _ = require('lodash');
var Element = require('../../render/element');

module.exports = function(compiler) {
  compiler.registerHelper('style', function(css, options) {
    var element = new Element('style');
    element.content = css;
    _.keys(options.hash).forEach(function(key) {
      element[key] = options.hash[key];
    });
    return element;
  });
};
