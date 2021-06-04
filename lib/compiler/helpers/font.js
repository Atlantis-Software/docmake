var _ = require('lodash');

module.exports = function(compiler) {
  compiler.registerHelper('font', function(fontName, options) {
    if (arguments.length !== 2) {
      throw new Error('font tag require one argument');
    }
    var element = {
      registerFont: fontName
    };
    _.keys(options.hash).forEach(function(key) {
      element[key] = options.hash[key];
    });
    return element;
  });
};
