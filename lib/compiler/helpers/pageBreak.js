var _ = require('lodash');
var Element = require('../../render/element');

module.exports = function(compiler) {
  compiler.registerHelper('pageBreak', function(options) {
    var element = new Element('pageBreak');
    _.keys(options.hash).forEach(function(key) {
      element[key] = options.hash[key];
    });
    return element;
  });
};
