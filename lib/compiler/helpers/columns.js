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

  compiler.registerHelper('stack', function(options) {
    var element = {
      stack: options.transclude()
    };
    _.keys(options.hash).forEach(function(key) {
      element[key] = options.hash[key];
    });
    return element;
  });
};
