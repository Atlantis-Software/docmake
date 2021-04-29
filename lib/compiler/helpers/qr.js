var _ = require('lodash');

module.exports = function(compiler) {
  compiler.registerHelper('qr', function(qr, options) {
    var element = {
      qr: qr
    };
    _.keys(options.hash).forEach(function(key) {
      element[key] = options.hash[key];
    });
    return element;
  });
};
