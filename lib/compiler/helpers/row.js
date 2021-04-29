var _ = require('lodash');

module.exports = function(compiler) {
  compiler.registerHelper('row', function(options) {
    var element = {
      row: options.transclude()
    };
    _.keys(options.hash).forEach(function(key) {
      element[key] = options.hash[key];
    });
    return element;
  });
};
