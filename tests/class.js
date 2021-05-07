/* eslint-disable */
var assert = require('assert');

var Docmake = require('../index');
var _ = require('lodash');

describe('Class', function () {
  it('should insert class in document', function (done) {
    var template = `{{class red color="#FF0000"}}`;
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
        assert(document.classes.red);
        done();
      });
    });
  });
  it('should apply class to element', function (done) {
    var template = `{{class red color="#FF0000"}}{{text "test" class=["red"]}}`;
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
        var text = _.find(document.pages[0].container, { text: "test" });
        assert.strictEqual(text.color, "#FF0000");
        done();
      });
    });
  });
});
