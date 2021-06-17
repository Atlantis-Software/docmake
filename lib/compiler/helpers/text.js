var _ = require('lodash');

module.exports = function(compiler) {
  compiler.registerHelper('text', function(text, options) {
    if (arguments.length !== 2) {
      throw new Error('text tag require one argument');
    }
    if (!_.isString(text) && !_.isNull(text)) {
      try {
        text = text.toString();
      } catch(e) {
        throw new Error('text tag require a string argument');
      }
    }
    var element = {
      text: text
    };
    _.keys(options.hash).forEach(function(key) {
      element[key] = options.hash[key];
    });
    return element;
  });
};
