/* eslint-disable */
var assert = require('assert');

var Docmake = require('../index');
var _ = require('lodash');

describe('Qr', function () {
  it('should insert a svg qrcode in document', function (done) {
    var template = `{{qr "this is a test"}}`;
    var doc = new Docmake();
    doc.compile(template, {}, function(err) {
      if (err) {
        return done(err);
      }
      doc.getDocument({}, function(err, document) {
        if (err) {
          return done(err);
        }
        document.pages[0].end();
        assert(document.pages[0].container[0].svg);
        done();
      });
    });
  });
});
