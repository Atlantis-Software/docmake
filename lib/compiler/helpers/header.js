var _ = require('lodash');

module.exports = function(compiler) {
  compiler.registerHelper('header', function(options) {
    var element = {
      header: options.transclude()
    };
    _.keys(options.hash).forEach(function(key) {
      element[key] = options.hash[key];
    });
    return element;
  });
};
