var _ = require('lodash');

module.exports = function(compiler) {
  compiler.registerHelper('class', function(className, options) {
    var element = {
      newClass: className
    };
    _.keys(options.hash).forEach(function(key) {
      element[key] = options.hash[key];
    });
    return element;
  });
};
