/* eslint-disable */
var assert = require('assert');
var Docmake = require('../index');

describe('Landscape/Portrait', function () {
  it('should generate a printable pdf in landscape mode', function (done) {
    var template = `{{text "test landscape"}}`;
    var doc = new Docmake();
    var buffers = [];
    doc.compile(template, {}, function(err) {
      if (err) {
        return done(err);
      }
      var doc_pdf = doc.getPdf({ layout : 'landscape' });
      doc_pdf.on('data', function(buffer) {
        buffers.push(buffer);
      });
      doc_pdf.on('end', function() {
        assert.strictEqual(doc_pdf.page.layout, 'landscape');
        done();
      });
    });
  });
  
  it('should generate a printable pdf in portrait mode', function (done) {
    var template = `{{text "test portrait"}}`;
    var doc = new Docmake();
    var buffers = [];
    doc.compile(template, {}, function(err) {
      if (err) {
        return done(err);
      }
      var doc_pdf = doc.getPdf({});
      doc_pdf.on('data', function(buffer) {
        buffers.push(buffer);
      });
      doc_pdf.on('end', function() {
        assert.strictEqual(doc_pdf.page.layout, 'portrait');
        done();
      });
    });
  });
});