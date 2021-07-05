var _ = require('lodash');
var Container = require('../container');
var style = require('../style');
var utils = require('../utils');

module.exports = function(Processor, document, parent, node) {
  node.id = 'columns';
  node.class = node.class || [];
  node.class.unshift('columns');
  node.width = utils.parseDimension(parent.getAvailableWidth(), node.width);
  // as borders and margins are applyed on columns, there is no need to remove them on node.availableWidth
  node.availableWidth = node.width;

  // create containers for columns and set withs with '*', 'auto' or number
  node.widths = node.widths || [];
  var columnContainersList = [];
  node.columns.forEach(function(columnNode, colIndex) {
    if (_.isUndefined(columnNode)) {
      return;
    }
    columnNode.class = columnNode.class || [];
    columnNode.class.unshift('column');
    style(document, node, columnNode);
    // apply borders and margins to columns
    columnNode.borders = _.clone(node.borders);
    columnNode.margins = _.clone(node.margins);
    // fusion left margins if no column gap
    if (node.columnGap === 0 && colIndex > 0) {
      var marginRight = node.columns[colIndex - 1].borders.right;
      if (marginRight >= columnNode.borders.left) {
        columnNode.borders.left = 0;
      } else {
        columnNode.borders.left = marginRight - columnNode.borders.left;
      }
    }
    node.widths[colIndex] = node.widths[colIndex] || '*';
    var columnContainer = null;
    if (_.isString(node.widths[colIndex])) {
      // Star case
      if (node.widths[colIndex] === '*') {
        columnContainer = new Container(columnNode, [node.availableWidth, Infinity]);
      // Auto case
      } else if (node.widths[colIndex] === 'auto') {
        columnContainer = new Container(columnNode,[node.availableWidth, Infinity]);
      // % case to Fixed number
      } else if (node.widths[colIndex].endsWith('%')) {
        var percent = parseFloat(node.widths[colIndex].slice(0, -1));
        if (_.isNaN(percent)) {
          throw new Error('invalid column with ' + node.widths[colIndex]);
        }
        node.widths[colIndex] = (node.availableWidth / 100) * percent;
        columnContainer = new Container(columnNode, [node.widths[colIndex], Infinity]);
      } else {
        var val = parseFloat(node.widths[colIndex]);
        if (_.isNaN(val)) {
          throw new Error('invalid table column width ' + node.widths[colIndex]);
        }
        node.widths[colIndex] = val;
        columnContainer = new Container(columnNode, [node.widths[colIndex], Infinity]);
      }
    // Fixed number case
    } else if (_.isNumber(node.widths[colIndex])) {
      columnContainer = new Container(columnNode, [node.widths[colIndex], Infinity]);
    } else {
      throw new Error('invalid column with ' + node.widths[colIndex]);
    }
    columnContainer.id = 'columnContainer' + colIndex;
    columnContainersList.push(columnContainer);
  });

  // Process width 'auto' and fixed number
  node.widths.forEach(function(width, colIndex) {
    if (_.isUndefined(columnContainersList[colIndex])) {
      return;
    }
    if (width !== '*' ) {
      var column = node.columns[colIndex];
      var columnContainer = columnContainersList[colIndex];
      var columnContext = {
        parent: columnContainer,
        parentStyle: node.columns[colIndex],
        document: document
      };
      var columnProcessor = new Processor(columnContext, column);
      columnProcessor.process();
      if (width === 'auto') {
        node.widths[colIndex] = columnContainer.getMinWidth();
        columnContainer.setWidth(node.widths[colIndex]);
      }
      columnContainer.setHeight(columnContainer.getMinHeight());
    }
  });

  // get available width for stars
  var availableWidth = node.availableWidth - _.sum(_.without(node.widths, '*')) - (node.widths.length - 1)  * node.columnGap;
  var starCount = _.filter(node.widths, function(w) { return w === '*'; }).length;
  var starWidth = availableWidth / starCount;

  // process '*'
  node.widths.forEach(function(width, colIndex) {
    var columnContainer = columnContainersList[colIndex];
    if (width === '*' && columnContainer) {
      node.widths[colIndex] = starWidth;
      columnContainer.setWidth(starWidth);
      var columnContext = {
        parent: columnContainer,
        parentStyle: node.columns[colIndex],
        document: document
      };
      var column = node.columns[colIndex];
      column.id = 'column' + colIndex;
      var columnProcessor = new Processor(columnContext, column);
      columnProcessor.process();
      columnContainer.setHeight(columnContainer.getMinHeight());
    }
  });

  // now every columns has a height, set node height with max columns height
  node.availableHeight = _.max(_.map(columnContainersList, 'height'));
  // as borders and margins are applyed on columns, there is no need to add them to height
  node.height = node.availableHeight;
  node.widths.forEach(function(width, colIndex) {
    var columnContainer = columnContainersList[colIndex];
    if (!_.isUndefined(columnContainer)) {
      columnContainer.setHeight(node.availableHeight);
    }
  });
  // create node container
  var columnsContainer = new Container({}, [node.width, node.height]);
  columnsContainer.id = 'columnsContainer';

  columnContainersList.forEach(function(container, columnIndex) {
    if (columnIndex > 0) {
      columnsContainer.insert({
        spacer: true,
        width: node.columnGap,
        height: 0
      });
    }
    container.id = 'column ' + columnIndex;
    columnsContainer.insert(container);
  });

  columnsContainer.lineEnd = true;
  return columnsContainer;
};
