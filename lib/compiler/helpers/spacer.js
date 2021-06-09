var _ = require('lodash');

module.exports = function(compiler) {
  compiler.registerHelper('hspace', function(space, options) {
    var element = {
      spacer: true,
      width: 0,
      height: space,
      lineEnd: true
    };
    _.keys(options.hash).forEach(function(key) {
      element[key] = options.hash[key];
    });
    return element;
  });
  compiler.registerHelper('vspace', function(space, options) {
    var element = {
      spacer: true,
      width: space,
      height: 0
    };
    _.keys(options.hash).forEach(function(key) {
      element[key] = options.hash[key];
    });
    return element;
  });
};
