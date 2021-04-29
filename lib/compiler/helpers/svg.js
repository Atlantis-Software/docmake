var _ = require('lodash');

module.exports = function(compiler) {
  compiler.registerHelper('svg', function(svg, options) {
    var element = {
      svg: svg
    };
    _.keys(options.hash).forEach(function(key) {
      element[key] = options.hash[key];
    });
    return element;
  });
};
