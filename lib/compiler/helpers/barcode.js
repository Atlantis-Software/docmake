var _ = require('lodash');
var JsBarcode = require('jsbarcode');
var DOMImplementation = require('xmldom').DOMImplementation;
var XMLSerializer = require('xmldom').XMLSerializer;

module.exports = function(compiler) {
  compiler.registerHelper('barcode', function(val, options) {
    if (arguments.length !== 2) {
      throw new Error('barcode tag require one argument');
    }
    var xmlSerializer = new XMLSerializer();
    var document = new DOMImplementation().createDocument('http://www.w3.org/1999/xhtml', 'html', null);
    var svgNode = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    JsBarcode(svgNode, val, { xmlDocument: document, displayValue: false, margin: 0 });
    var svg = xmlSerializer.serializeToString(svgNode);
    var element = {
      svg
    };
    _.keys(options.hash).forEach(function(key) {
      element[key] = options.hash[key];
    });
    return element;
  });
};
