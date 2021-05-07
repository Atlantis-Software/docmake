/* eslint-disable */
var assert = require('assert');

var Docmake = require('../index');
var _ = require('lodash');

describe('Font', function () {
  it('should register font in document', function (done) {
    var template = `{{font myfont normal="./normal.ttf"}}`;
    var doc = new Docmake();
    doc.compile(template, {}, function(err) {
      if (err) {
        return done(err);
      }
      doc.getDocument({}, function(err, document) {
        if (err) {
          return done(err);
        }
        assert(document.fonts.myfont);
        assert.strictEqual(document.fonts.myfont.normal, "./normal.ttf");
        done();
      });
    });
  });
});
