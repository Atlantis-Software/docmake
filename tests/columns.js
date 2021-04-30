/* eslint-disable */
var assert = require('assert');

var Docmake = require('../index');
var _ = require('lodash');

describe('Columns', function () {
  describe('buildColumnWidths', function () {
    it('should set calculate column widths', function (done) {
      var template = `
      {{#columns columnGap=0 margin=0 border=0 widths=[10, "20","auto", "*", "10%", 10] width="300"}}
        {{text "a"}}
        {{text "b"}}
        {{svg "<svg xmlns=\\"http://www.w3.org/2000/svg\\" version=\\"1.1\\" width=\\"50\\" height=\\"50\\"></svg>"}}
        {{text "d"}}
        {{text "e"}}
        {{text "f"}}
      {{/columns}}`;
      var doc = new Docmake();
      doc.compile(template, {}, function(err) {
        if (err) {
          return done(err);
        }
        doc.getDocument({ margins: { top: 0, left: 0, right: 0, bottom: 0 } }, function(err, document) {
          if (err) {
            return done(err);
          }
          document.pages[0].end();
          // console.log(JSON.stringify(document.pages[0].container));
          var col1x = _.find(document.pages[0].container, { text: 'a' }).x;
          var col2x = _.find(document.pages[0].container, { text: 'b' }).x;
          var col3x = _.find(document.pages[0].container, { svg: [] }).x;
          var col4x = _.find(document.pages[0].container, { text: 'd' }).x;
          var col5x = _.find(document.pages[0].container, { text: 'e' }).x;
          var col6x = _.find(document.pages[0].container, { text: 'f' }).x;
          assert.strictEqual(col1x, 0);
          assert.strictEqual(col2x, 10);
          assert.strictEqual(col3x, 30);
          assert.strictEqual(col4x, 80);
          assert.strictEqual(col5x, 260);
          assert.strictEqual(col6x, 290);
          done();
        });
      });
    });
  });
});
