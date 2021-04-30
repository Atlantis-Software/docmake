var _ = require('lodash');
var Container = require('../container');
var style = require('../style');
var utils = require('../utils');

module.exports = function(Processor, document, parent, node) {
  node.id = 'table';
  node.class = node.class || [];
  node.class.unshift('table');
  node.width = utils.parseDimension(parent.getAvailableWidth(), node.width);
  node.widths = node.widths || [];
  if (!node.table || !node.table.body || !node.table.body[0] || !node.table.body[0].row || !_.isArray(node.table.body[0].row)) {
    throw new Error('Malformed table ' + JSON.stringify(node));
  }
  // set widths
  node.table.body[0].row.forEach(function(column, colIndex) {
    node.widths[colIndex] = node.widths[colIndex] || '*';
    if (_.isString(node.widths[colIndex])) {
      if (node.widths[colIndex] === '*') {
        // do nothing
      } else if (node.widths[colIndex] === 'auto') {
        // do nothing
      } else if (node.widths[colIndex].endsWith('%')) {
        var percent = parseFloat(node.widths[colIndex].slice(0, -1));
        if (_.isNaN(percent)) {
          throw new Error('invalid table column width ' + node.widths[colIndex]);
        }
        node.widths[colIndex] = (node.width / 100) * percent;
      } else {
        var val = parseFloat(node.widths[colIndex]);
        if (_.isNaN(val)) {
          throw new Error('invalid table column width ' + node.widths[colIndex]);
        }
        node.widths[colIndex] = val;
      }
    }
  });

  // create Container matrixContainer
  var matrixContainer = [];
  var matrixNode = [];

  if (node.repeatHeader) {
    node.table.headers = [];
  }

  // for each row
  node.table.body.forEach(function(rowNode, rowIndex) {
    rowNode.id = 'row' + rowIndex;
    rowNode.class = rowNode.class || [];
    if (rowIndex % 2) {
      rowNode.class.unshift('row_even');
    } else {
      rowNode.class.unshift('row_odd');
    }
    rowNode.class.unshift('row');
    style(node, rowNode);
    // for each column
    node.widths.forEach(function(width, colIndex) {
      var cellNode = rowNode.row[colIndex];
      cellNode.id = 'cell' + colIndex + '_' + rowIndex;
      // add default class to cellNode and get content to process auto and fixed width
      cellNode.class = cellNode.class || [];
      var content = [];
      if (cellNode.header) {
        content = cellNode.header;
        cellNode.class.unshift('header');
        if (node.table.headers) {
          node.table.headers.push({
            colIndex,
            rowIndex
          });
        }
      } else {
        content = cellNode.column;
        if (rowIndex % 2) {
          cellNode.class.unshift('cell_even');
        } else {
          cellNode.class.unshift('cell_odd');
        }
      }
      cellNode.class.unshift('cell');
      style(rowNode, cellNode);
      // init matrixContainer and matrixNode column if necessary
      matrixContainer[colIndex] = matrixContainer[colIndex] || [];
      matrixNode[colIndex] = matrixNode[colIndex] || [];
      // create cell matrixContainer container
      if (width === '*' || width === 'auto') {
        matrixContainer[colIndex][rowIndex] = new Container(cellNode, [node.width, Infinity]);
      } else {
        matrixContainer[colIndex][rowIndex] = new Container(cellNode, [width, Infinity]);
      }
      matrixNode[colIndex][rowIndex] = cellNode;

      // process cell width auto and fixed width
      if (width !== '*') {
        var cellContext = {
          parent: matrixContainer[colIndex][rowIndex],
          parentStyle: cellNode,
          document: document
        };
        var cellProcessor = new Processor(cellContext, content);
        cellProcessor.process();
      }
    });
  });

  node.widths.forEach(function(width, colIndex) {
    // compute and set auto width value
    if (width === 'auto') {
      // TODO check margin right foreach columns
      var maxWidth = _.max(_.map(matrixContainer[colIndex], function(c) { return c.getMinWidth(); })) + matrixContainer[colIndex][0].margins.right;
      node.widths[colIndex] = maxWidth;
      matrixContainer[colIndex].forEach(function(cellContainer) {
        cellContainer.setWidth(maxWidth);
      });
    }
  });

  // get available width for stars
  var availableWidth = node.width - _.sum(_.without(node.widths, '*'));
  var starCount = _.filter(node.widths, function(w) { return w === '*'; }).length;
  var starWidth = availableWidth / starCount;

  node.widths.forEach(function(width, colIndex) {
    // set stars width and process stars' columns
    if (width === '*') {
      // set stars width
      node.widths[colIndex] = starWidth;
      // process stars' columns
      matrixContainer[colIndex].forEach(function(cellContainer, rowIndex) {
        cellContainer.class = cellContainer.class || [];
        // set cellContainer to stars width
        cellContainer.setWidth(starWidth);
        var cellNode = matrixNode[colIndex][rowIndex];
        // TODO add specific style to content
        var content = [];
        if (cellNode.column) {
          content = cellNode.column;
        } else if (cellNode.header) {
          content = cellNode.header;
        }
        var cellContext = {
          parent: cellContainer,
          parentStyle: cellNode,
          document: document
        };
        var cellProcessor = new Processor(cellContext, content);
        cellProcessor.process();
      });
    }
  });

  // build rows
  var rows = [];
  var colCount = matrixContainer.length;
  var rowCount = matrixContainer[0].length;
  //for each row get column maxHeight
  for (var rowIndex = 0; rowIndex < rowCount; rowIndex++) {
    var heights = [];
    for (let colIndex = 0; colIndex < colCount; colIndex++) {
      heights.push(matrixContainer[colIndex][rowIndex].getMinHeight());
    }
    var maxHeight = _.max(heights);
    // create a row container
    var rowNode = node.table.body[rowIndex];
    var rowContainer = new Container(rowNode, [node.width, maxHeight]);
    rowContainer.id = 'rowContainer' + rowIndex;
    // set cell height and insert in row container
    for (let colIndex = 0; colIndex < colCount; colIndex++) {
      var cellContainer = matrixContainer[colIndex][rowIndex];
      cellContainer.setHeight(maxHeight);
      rowContainer.insert(cellContainer);
    }
    rowContainer.lineEnd = true;
    rows.push(rowContainer);
  }

  // build headers container for repeatHeader
  if (node.repeatHeader) {
    var headerRows = {};
    node.table.headers.forEach(function(pos) {
      headerRows[pos.rowIndex] = headerRows[pos.rowIndex] || new Container(node.table.body[pos.rowIndex], [rows[pos.rowIndex].width, rows[pos.rowIndex].height]);
      var headerContainer = matrixContainer[pos.colIndex][pos.rowIndex].clone();
      headerContainer.id = 'repeatHeaderCell_' + pos.colIndex + '_' + pos.rowIndex;
      headerRows[pos.rowIndex].insert(headerContainer);
    });
    node.repeatOnBreak = new Container(node.table.body[0], [node.width, Infinity]);
    var headerHeight = 0;
    _.keys(headerRows).forEach(function(rowIndex) {
      headerHeight += headerRows[rowIndex].height;
      node.repeatOnBreak.insert(headerRows[rowIndex]);
    });
    node.repeatOnBreak.setHeight(headerHeight);
  }

  // set node height
  node.height = _.sum(_.map(rows, 'height'));
  // create a container for the table
  var tableContainer = new Container(node, [node.width, node.height]);
  tableContainer.id = 'table';
  rows.forEach(function(row) {
    tableContainer.insert(row);
  });
  tableContainer.lineEnd = true;
  return tableContainer;
};
