var _ = require('lodash');

module.exports = function(compiler) {
  compiler.registerHelper('pageBreak', function(options) {
    var element = {
      pageBreak: true
    };
    _.keys(options.hash).forEach(function(key) {
      element[key] = options.hash[key];
    });
    return element;
  });
};
