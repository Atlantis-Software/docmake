var _ = require('lodash');
var fs = require('fs');
var Element = require('../../render/element');

module.exports = function(compiler) {
  compiler.registerHelper('image', function(img, options) {
    if (arguments.length !== 2) {
      throw new Error('image tag require one argument');
    }
    if (_.isString(img) && img.indexOf('base64,') !== 0) {
      var stat = fs.statSync(img);
      if (!stat.isFile()) {
        throw new Error('invalid file path ' + img);
      }
    }
    var element = new Element('image');
    element.content = img;
    _.keys(options.hash).forEach(function(key) {
      element[key] = options.hash[key];
    });
    return element;
  });
};
