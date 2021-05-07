/* eslint-disable */
var assert = require('assert');

var Docmake = require('../index');
var _ = require('lodash');

describe('PageBreak', function () {
  it('should insert new page in document', function (done) {
    var template = `{{pageBreak}}`;
    var doc = new Docmake();
    doc.compile(template, {}, function(err) {
      if (err) {
        return done(err);
      }
      doc.getDocument({}, function(err, document) {
        if (err) {
          return done(err);
        }
        assert.strictEqual(document.pages.length, 2);
        done();
      });
    });
  });
});
