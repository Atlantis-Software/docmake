var _ = require('lodash');
var qr = require('qr-image');
var Element = require('../../render/element');

module.exports = function(compiler) {
  compiler.registerHelper('qr', function(val, options) {
    if (arguments.length !== 2) {
      throw new Error('qr tag require one argument');
    }
    var element = new Element('svg');
    element.content = qr.imageSync(val, { type: 'svg' });
    _.keys(options.hash).forEach(function(key) {
      element[key] = options.hash[key];
    });
    if (!element.width && !element.height) {
      element.width = 120;
    }
    return element;
  });
};
