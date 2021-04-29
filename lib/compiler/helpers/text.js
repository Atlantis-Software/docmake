var _ = require('lodash');

module.exports = function(compiler) {
  compiler.registerHelper('text', function(text, options) {
    var element = {
      text: text
    };
    _.keys(options.hash).forEach(function(key) {
      element[key] = options.hash[key];
    });
    return element;
  });
};
