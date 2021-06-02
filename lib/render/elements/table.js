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
  var colCount = _.max(_.map(node.table.body, function(b) { return b.row.length; }));
  for (var colIndex = 0; colIndex < colCount; colIndex++) {
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
  }

  // create Container matrixContainer
  var matrixContainer = [];
  var matrixNode = [];
  var colspans = [];

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
    style(document, node, rowNode);
    // for each column
    var colIndex = 0;
    rowNode.row.forEach(function(cellNode) {
      cellNode.id = 'cell' + colIndex + '_' + rowIndex;
      var width = node.widths[colIndex];
      if (cellNode.colspan && cellNode.colspan > 1) {
        width = 'colspan';
      }
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
      style(document, rowNode, cellNode);
      // init matrixContainer and matrixNode column if necessary
      matrixContainer[colIndex] = matrixContainer[colIndex] || [];
      matrixNode[colIndex] = matrixNode[colIndex] || [];
      // create cell matrixContainer container
      if (width === 'colspan' || width === '*' || width === 'auto') {
        matrixContainer[colIndex][rowIndex] = new Container(cellNode, [node.width, Infinity]);
      } else {
        matrixContainer[colIndex][rowIndex] = new Container(cellNode, [width, Infinity]);
      }
      matrixNode[colIndex][rowIndex] = cellNode;

      // process cell width auto and fixed width
      if (width !== '*' && width !== 'colspan') {
        var cellContext = {
          parent: matrixContainer[colIndex][rowIndex],
          parentStyle: cellNode,
          document: document
        };
        var cellProcessor = new Processor(cellContext, content);
        cellProcessor.process();
      }
      if (cellNode.colspan && cellNode.colspan > 1) {
        colspans.push({colIndex, rowIndex});
        matrixContainer[colIndex][rowIndex].colspan = cellNode.colspan;
        colIndex += cellNode.colspan - 1;
      }
      colIndex++;
    });
  });

  node.widths.forEach(function(width, colIndex) {
    // compute and set auto width value
    if (width === 'auto') {
      var maxWidth = _.max(_.map(matrixContainer[colIndex], function(cellContainer) {
        if (cellContainer.colspan) {
          return 0;
        }
        return cellContainer.getMinWidth() + cellContainer.margins.right;
      }));
      node.widths[colIndex] = maxWidth;
      matrixContainer[colIndex].forEach(function(cellContainer) {
        if (!cellContainer.colspan) {
          cellContainer.setWidth(maxWidth);
        }
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
        if (cellContainer.colspan) {
          return;
        }
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

  // process colspan
  colspans.forEach(function(colspan) {
    var cellContainer = matrixContainer[colspan.colIndex][colspan.rowIndex];
    var width = _.sum(node.widths.slice(colspan.colIndex, colspan.colIndex + cellContainer.colspan));
    cellContainer.setWidth(width);
    var cellNode = matrixNode[colspan.colIndex][colspan.rowIndex];
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

  // build rows
  var rows = [];
  var rowCount = _.max(_.map(matrixContainer, function(b) { return b.length; }));
  //for each row get column maxHeight
  for (var rowIndex = 0; rowIndex < rowCount; rowIndex++) {
    var heights = [];
    for (let colIndex = 0; colIndex < colCount; colIndex++) {
      if (matrixContainer[colIndex][rowIndex]) {
        heights.push(matrixContainer[colIndex][rowIndex].getMinHeight());
      }
    }
    var maxHeight = _.max(heights);
    // create a row container
    var rowNode = node.table.body[rowIndex];
    var rowContainer = new Container(rowNode, [node.width, maxHeight]);
    rowContainer.id = 'rowContainer' + rowIndex;
    // set cell height and insert in row container
    for (let colIndex = 0; colIndex < colCount; colIndex++) {
      var cellContainer = matrixContainer[colIndex][rowIndex];
      if (cellContainer) {
        cellContainer.setHeight(maxHeight);
        rowContainer.insert(cellContainer);
      }
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
