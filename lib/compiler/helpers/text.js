var _ = require('lodash');
var Element = require('../../render/element');

module.exports = function(compiler) {
  compiler.registerHelper('text', function(text, options) {
    if (arguments.length !== 2) {
      throw new Error('text tag require one argument');
    }
    if (!_.isString(text) && !_.isNull(text)) {
      try {
        text = text.toString();
      } catch (e) {
        throw new Error('text tag require a string argument');
      }
    }
    var element = new Element('text');
    element.content = text;
    _.keys(options.hash).forEach(function(key) {
      element[key] = options.hash[key];
    });
    return element;
  });
};
