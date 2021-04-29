var _ = require('lodash');

module.exports = function(compiler) {
  compiler.registerHelper('image', function(img, options) {
    var element = {
      image: img
    };
    _.keys(options.hash).forEach(function(key) {
      element[key] = options.hash[key];
    });
    return element;
  });
};
