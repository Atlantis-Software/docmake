var PdfKit = require('pdfkit');
var PclKit = require('pclkit');
var Compiler = require('./lib/compiler/compiler');
var Processor = require('./lib/render/processor');
var Document = require('./lib/render/document');
var fonts = require('./fonts/fonts');

var docmake = function() {
  this.compiler = new Compiler();
  this._compiled = null;
};

docmake.prototype.compile = function(template, scope, cb) {
  var self = this;
  this.compiler.compile(template, scope, function(err, nodes) {
    if (err) {
      return cb(err);
    }
    self._compiled = nodes;
    cb(null, nodes);
  });
};

docmake.prototype.getPdf = function(options) {
  if (!this._compiled) {
    throw new Error('getPdf() require a compile() before');
  }
  options = options || {};
  options.size = options.size || 'A4';
  options.margins = options.margins || { top: 10, left: 10, right: 10, bottom: 10 };
  options.fonts = options.fonts || fonts;
  var doc = new PdfKit({size: options.size, margins: [0, 0, 0, 0]});
  var document = new Document(options, doc);
  var rootContext = {
    parent: document,
    document: document
  };
  var processor = new Processor(rootContext, this._compiled);
  processor.process();
  document.render();
  return doc;
};

docmake.prototype.getPcl = function(options) {
  if (!this._compiled) {
    throw new Error('getPcl() require a compile() before');
  }
  options = options || {};
  options.size = options.size || 'A4';
  options.margins = options.margins || { top: 10, left: 10, right: 10, bottom: 10 };
  options.fonts = options.fonts || fonts;
  var doc = new PclKit({size: options.size, margins: [0, 0, 0, 0]});
  var document = new Document(options, doc);
  var rootContext = {
    parent: document,
    document: document
  };
  var processor = new Processor(rootContext, this._compiled);
  processor.process();
  document.render();
  return doc;
};

docmake.prototype.getDocument = function(options, cb) {
  if (!this._compiled) {
    throw new Error('getPdf() require a compile() before');
  }
  options = options || {};
  options.size = options.size || 'A4';
  options.margins = options.margins || { top: 10, left: 10, right: 10, bottom: 10 };
  options.fonts = options.fonts || fonts;
  var doc = new PdfKit({size: options.size, margins: [0, 0, 0, 0]});
  var document = new Document(options, doc);
  var rootContext = {
    parent: document,
    document: document
  };
  var processor = new Processor(rootContext, this._compiled);
  processor.process();
  return cb(null, document);
};

module.exports = docmake;
