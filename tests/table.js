/* eslint-disable */
var assert = require('assert');

var Docmake = require('../index');
var _ = require('lodash');

describe('Table', function () {
  describe('buildColumnWidths', function () {
    it('should set calculate column widths', function (done) {
      var template = `
      {{#table border=0 widths=[10, "20","auto", "*", "10%"]  width=300}}
        {{#row border=0}}
          {{#column border=0 fillColor="#000000"}}{{/column}}
          {{#column border=0 fillColor="#000001"}}{{/column}}
          {{#column border=0 fillColor="#000002"}}{{svg "<svg xmlns=\\"http://www.w3.org/2000/svg\\" version=\\"1.1\\" width=\\"50\\" height=\\"50\\"></svg>"}}{{/column}}
          {{#column border=0 fillColor="#000003"}}{{/column}}
          {{#column border=0 fillColor="#000004"}}{{/column}}
        {{/row}}
      {{/table}}`;
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
          // console.log(JSON.stringify(document.pages[0].container));
          var col1Width = _.find(document.pages[0].container, { rect: { fill: "#000000" } }).rect.width;
          var col2Width = _.find(document.pages[0].container, { rect: { fill: "#000001" } }).rect.width;
          var col3Width = _.find(document.pages[0].container, { rect: { fill: "#000002" } }).rect.width;
          var col4Width = _.find(document.pages[0].container, { rect: { fill: "#000003" } }).rect.width;
          var col5Width = _.find(document.pages[0].container, { rect: { fill: "#000004" } }).rect.width;
          assert.strictEqual(col1Width, 10);
          assert.strictEqual(col2Width, 20);
          assert.strictEqual(col3Width, 50);
          assert.strictEqual(col4Width, 300 - 10 - 20 -50 - 30);
          assert.strictEqual(col5Width, 30);
          done();
        });
      });
    });
  });
});
