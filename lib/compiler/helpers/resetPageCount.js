var _ = require('lodash');

module.exports = function(compiler) {
  compiler.registerHelper('resetPageCount', function(options) {
    var element = {
      resetPageCount: true
    };
    _.keys(options.hash).forEach(function(key) {
      element[key] = options.hash[key];
    });
    return element;
  });
};
