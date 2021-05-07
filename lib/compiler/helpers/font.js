var _ = require('lodash');

module.exports = function(compiler) {
  compiler.registerHelper('font', function(fontName, options) {
    var element = {
      registerFont: fontName
    };
    _.keys(options.hash).forEach(function(key) {
      element[key] = options.hash[key];
    });
    return element;
  });
};
