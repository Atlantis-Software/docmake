var _ = require('lodash');

module.exports = function(compiler) {
  compiler.registerHelper('columns', function(options) {
    var element = {
      columns: options.transclude()
    };
    _.keys(options.hash).forEach(function(key) {
      element[key] = options.hash[key];
    });
    return element;
  });
};
