var _ = require('lodash');
var Container = require('../container');
var style = require('../style');
var utils = require('../utils');

var id = 0;
var tableMatrix = function(node, parent, document, Processor) {
  var self = this;
  if (!node.table || !node.table.body) {
    throw new Error('Malformed table ' + JSON.stringify(node));
  }
  this.id = node.id = 'table_' + id++;
  this.tableNode = node;
  this.document = document;
  this.Processor = Processor;
  this.matrix = [];
  this.colspans = [];
  // add style to table
  if (_.isUndefined(this.tableNode.class)) {
    this.tableNode.class = [];
  }
  if (!_.isArray(this.tableNode.class)) {
    this.tableNode.class = [this.tableNode.class];
  }
  this.tableNode.class.unshift('table');
  style(this.document, parent, this.tableNode);

  // define widths
  this.tableNode.width = utils.parseDimension(parent.getAvailableWidth(), this.tableNode.width);
  this.tableNode.availableWidth = node.width - node.margins.left - node.margins.right - node.borders.left - node.borders.right;
  this.tableNode.widths = this.tableNode.widths || [];

  // remove element that aren't row
  this.tableNode.table.body = _.filter(this.tableNode.table.body, function(b) { return _.isArray(b.row); });

  // set column and row count
  this.rowCount = this.tableNode.table.body.length;
  this.colCount = _.max(_.map(this.tableNode.table.body, function(b) { return b.row.length; }));

  // normalize columns widths
  for (var colIndex = 0; colIndex < this.colCount; colIndex++) {
    self.tableNode.widths[colIndex] = self.tableNode.widths[colIndex] || '*';
    if (_.isString(self.tableNode.widths[colIndex])) {
      if (self.tableNode.widths[colIndex] === '*') {
        // do nothing
      } else if (self.tableNode.widths[colIndex] === 'auto') {
        // do nothing
      } else if (self.tableNode.widths[colIndex].endsWith('%')) {
        var percent = parseFloat(self.tableNode.widths[colIndex].slice(0, -1));
        if (_.isNaN(percent)) {
          throw new Error('invalid table column width ' + self.tableNode.widths[colIndex]);
        }
        self.tableNode.widths[colIndex] = (self.tableNode.availableWidth / 100) * percent;
      } else {
        var val = parseFloat(self.tableNode.widths[colIndex]);
        if (_.isNaN(val)) {
          throw new Error('invalid table column width ' + self.tableNode.widths[colIndex]);
        }
        self.tableNode.widths[colIndex] = val;
      }
    }
  }

  // check repeatHeader attribute
  if (this.tableNode.repeatHeader) {
    this.headers = [];
  }

  // add all rows
  this.tableNode.table.body.forEach(function(rowNode) {
    self.addRow(rowNode);
  });

  // add cells
  this.tableNode.table.body.forEach(function(rowNode, rowIndex) {
    var row = self.getRow(rowIndex);
    var colIndex = 0;
    rowNode.row.forEach(function(cellNode) {
      var cell = self.addCell(rowIndex, colIndex, cellNode);
      row.cells.push(cell);
      if (cell.cellNode.colspan > 1) {
        self.colspans.push({colIndex, rowIndex});
        for (var colspan = 2; colspan <= cell.cellNode.colspan; colspan++) {
          var colspanCell = _.clone(cell);
          colspanCell.colspan = colspan;
          row.cells.push(cell);
        }
        //matrixContainer[colIndex][rowIndex].colspan = cellNode.colspan;
        colIndex += cell.cellNode.colspan - 1;
      }
      colIndex++;
    });
  });

  // define auto width columns
  this.tableNode.widths.forEach(function(width, colIndex) {
    if (width === 'auto') {
      var autoWidths = [0];
      var marginsBorders = [0];
      // get each cell width to define the max one
      for (let rowIndex = 0; rowIndex < self.rowCount; rowIndex++) {
        let cell = self.getCell(rowIndex, colIndex);
        if (!cell || cell.cellNode.colspan || cell.colspan) {
          continue;
        }
        autoWidths.push(cell.container.getMinWidth());
        let rowNode = self.getRow(rowIndex).rowNode;
        if (colIndex === 0) {
          marginsBorders.push(rowNode.margins.left + rowNode.borders.left);
        }
        if (colIndex === (self.rowCount -1)) {
          marginsBorders.push(rowNode.margins.right + rowNode.borders.right);
        }
      }
      let maxWidth = _.max(autoWidths);
      // if we can't define any cell width in column then set the columns to start width
      if (maxWidth === 0) {
        self.tableNode.widths[colIndex] = '*';
        return;
      }
      // set all cell in columns to the defined width
      self.tableNode.widths[colIndex] = maxWidth + _.max(marginsBorders);
      for (let rowIndex = 0; rowIndex < self.rowCount; rowIndex++) {
        let cell = self.getCell(rowIndex, colIndex);
        if (!cell || cell.cellNode.colspan || cell.colspan) {
          continue;
        }
        let autoWidth = self.tableNode.widths[colIndex];
        let rowNode = self.getRow(rowIndex).rowNode;
        if (colIndex === 0) {
          autoWidth = autoWidth - rowNode.margins.left - rowNode.borders.left;
        }
        if (colIndex === (self.rowCount -1)) {
          autoWidth = autoWidth - rowNode.margins.right - rowNode.borders.right;
        }
        cell.container.setWidth(autoWidth);
      }
    }
  });

  // get available width for stars width columns
  var availableWidthForStars = this.tableNode.availableWidth - _.sum(_.without(this.tableNode.widths, '*'));
  // define star width
  var starCount = _.filter(this.tableNode.widths, function(w) { return w === '*'; }).length;
  var starWidth = availableWidthForStars / starCount;

  // apply star width and process cells
  this.tableNode.widths.forEach(function(width, colIndex) {
    if (width === '*') {
      self.tableNode.widths[colIndex] = starWidth;
      for (let rowIndex = 0; rowIndex < self.rowCount; rowIndex++) {
        let cell = self.getCell(rowIndex, colIndex);
        if (!cell || cell.cellNode.colspan || cell.colspan) {
          continue;
        }
        // remove row margins and borders if necessary
        let rowNode = self.getRow(rowIndex).rowNode;
        let cellWidth = starWidth;
        if (colIndex === 0) {
          cellWidth = starWidth - rowNode.margins.left - rowNode.borders.left;
        }
        if (colIndex === (self.colCount -1)) {
          cellWidth = starWidth - rowNode.margins.right - rowNode.borders.right;
        }
        // set cellContainer to star width
        cell.container.setWidth(cellWidth);
        var content = [];
        if (cell.cellNode.column) {
          content = cell.cellNode.column;
        } else if (cell.cellNode.header) {
          content = cell.cellNode.header;
        }
        var cellContext = {
          parent: cell.container,
          parentStyle: cell.cellNode,
          document: self.document
        };
        var cellProcessor = new self.Processor(cellContext, content);
        cellProcessor.process();
      }
    }
  });

  // process colspans
  this.colspans.forEach(function(colspan) {
    let cell = self.getCell(colspan.rowIndex, colspan.colIndex);
    let cellWidth = _.sum(self.tableNode.widths.slice(colspan.colIndex, colspan.colIndex + cell.cellNode.colspan));
    let rowNode = self.getRow(colspan.rowIndex).rowNode;
    if (colspan.colIndex === 0) {
      cellWidth = cellWidth - rowNode.margins.left - rowNode.borders.left;
    }
    if ((colspan.colIndex + cell.cellNode.colspan) === self.colCount) {
      cellWidth = cellWidth - rowNode.margins.right - rowNode.borders.right;
    }
    cell.container.setWidth(cellWidth);
    var content = [];
    if (cell.cellNode.column) {
      content = cell.cellNode.column;
    } else if (cell.cellNode.header) {
      content = cell.cellNode.header;
    }
    var cellContext = {
      parent: cell.container,
      parentStyle: cell.cellNode,
      document: self.document
    };
    var cellProcessor = new self.Processor(cellContext, content);
    cellProcessor.process();
  });

  // build rows
  var rows = [];
  for (var rowIndex = 0; rowIndex < this.rowCount; rowIndex++) {
    // get row's cell max height
    var heights = [];
    for (let colIndex = 0; colIndex < this.colCount; colIndex++) {
      let cell = this.getCell(rowIndex, colIndex);
      if (cell) {
        heights.push(_.max([cell.cellNode.height, cell.container.getMinHeight()]));
      }
    }
    var maxHeight = _.max(heights);
    var row = this.getRow(rowIndex);
    var rowNode = row.rowNode;
    rowNode.width = this.tableNode.availableWidth;
    if (_.isUndefined(rowNode.height)) {
      rowNode.availableHeight = maxHeight;
      rowNode.height = rowNode.availableHeight + rowNode.margins.top + rowNode.margins.bottom + rowNode.borders.top + rowNode.borders.bottom;
    } else {
      let rowHeight;
      if (_.isString(rowNode.height)) {
        rowHeight = parseFloat(rowNode.height);
        if (_.isNaN(rowHeight)) {
          throw new Error('invalid table row height ' + rowNode.height);
        }
      } else if (_.isNumber(rowNode.height)) {
        rowHeight = rowNode.height;
      } else {
        throw new Error('invalid table row height ' + rowNode.height);
      }
      if (maxHeight > rowHeight) {
        rowHeight = maxHeight;
      }
      rowNode.height = rowHeight;
      rowNode.availableHeight = rowNode.height - rowNode.margins.top - rowNode.margins.bottom - rowNode.borders.top - rowNode.borders.bottom;
    }
    row.container = new Container(rowNode, [rowNode.width, rowNode.height]);
    row.container.id = this.id + '_rowContainer' + rowIndex;
    // set cells height and insert in row container
    for (let colIndex = 0; colIndex < this.colCount; colIndex++) {
      let cell = this.getCell(rowIndex, colIndex);
      if (cell && cell.container) {
        cell.container.setHeight(rowNode.availableHeight);
        row.container.insert(cell.container);
      }
    }
    row.container.lineEnd = true;
    rows.push(row.container);
  }

  // build headers container for repeatHeader
  if (this.tableNode.repeatHeader) {
    var headerRows = {};
    this.headers.forEach(function(pos) {
      let row = self.getRow(pos.rowIndex);
      headerRows[pos.rowIndex] = headerRows[pos.rowIndex] || new Container(row.rowNode, [row.rowNode.width, row.rowNode.height]);
      let cell = self.getCell(pos.rowIndex, pos.colIndex);
      var headerContainer = cell.container.clone();
      headerContainer.id = self.id + '_repeatHeaderCell_' + pos.colIndex + '_' + pos.rowIndex;
      headerRows[pos.rowIndex].insert(headerContainer);
    });
    self.tableNode.repeatOnBreak = new Container({}, [self.tableNode.availableWidth, Infinity]);
    var headerHeight = 0;
    _.keys(headerRows).forEach(function(rowIndex) {
      headerHeight += headerRows[rowIndex].height;
      self.tableNode.repeatOnBreak.insert(headerRows[rowIndex]);
    });
    self.tableNode.repeatOnBreak.setHeight(headerHeight);
  }

  // set table height
  this.tableNode.height = _.sum(_.map(rows, 'height')) + this.tableNode.margins.top + this.tableNode.margins.bottom + this.tableNode.borders.top + this.tableNode.borders.bottom;
  // create a container for the table
  this.container = new Container(this.tableNode, [this.tableNode.width, this.tableNode.height]);
  this.container.id = this.id + '_container';
  rows.forEach(function(row) {
    self.container.insert(row);
  });
  self.container.lineEnd = true;
};

tableMatrix.prototype.addRow = function(rowNode) {
  var rowIndex = this.matrix.length;
  // set id
  rowNode.id = this.id + '_row' + rowIndex;
  //set width
  rowNode.width = this.tableNode.availableWidth;
  // add style
  if (_.isUndefined(rowNode.class)) {
    rowNode.class = [];
  }
  if (!_.isArray(rowNode.class)) {
    rowNode.class = [rowNode.class];
  }
  if (rowIndex % 2) {
    rowNode.class.unshift('row_even');
  } else {
    rowNode.class.unshift('row_odd');
  }
  rowNode.class.unshift('row');
  style(this.document, this.tableNode, rowNode);

  // collapse borders

  // collapse left border
  rowNode.borders.left -= _.min([rowNode.borders.left, this.tableNode.borders.left]);

  // collapse top border
  var rowTopBorderToCollapse = this.tableNode.borders.top;
  if (rowIndex !== 0) {
    rowTopBorderToCollapse = this.getRow(rowIndex - 1).rowNode.borders.bottom;
  }
  rowNode.borders.top -= _.min([rowTopBorderToCollapse, rowNode.borders.top]);

  // collapse right border
  rowNode.borders.right -= _.min([rowNode.borders.right, this.tableNode.borders.right]);

  // collapse bottom border
  if (rowIndex === this.rowCount - 1) {
    rowNode.borders.bottom -= _.min([rowNode.borders.bottom, this.tableNode.borders.bottom]);
  }

  rowNode.availableWidth = rowNode.width - rowNode.margins.left - rowNode.margins.right - rowNode.borders.left - rowNode.borders.right;
  var row = {
    rowIndex,
    rowNode,
    // rowConainter,
    cells: []
  };
  this.matrix.push(row);
  return row;
};

tableMatrix.prototype.getRow = function(rowIndex) {
  return this.matrix[rowIndex];
};

tableMatrix.prototype.addCell = function(rowIndex, colIndex, cellNode) {
  var rowNode = this.getRow(rowIndex).rowNode;
  // set id
  cellNode.id = rowNode.id + '_cell' + colIndex;
  // set width
  var width = this.tableNode.widths[colIndex];
  if (cellNode.colspan && cellNode.colspan > 1) {
    width = 'colspan';
  }
  // add style
  if (_.isUndefined(cellNode.class)) {
    cellNode.class = [];
  }
  if (!_.isArray(cellNode.class)) {
    cellNode.class = [cellNode.class];
  }
  var content = [];
  if (cellNode.header) {
    content = cellNode.header;
    cellNode.class.unshift('header');
    if (this.headers) {
      this.headers.push({
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
  style(this.document, rowNode, cellNode);
  // collapse borders

  // collapse left border
  var cellLeftBorderToCollapse = 0;
  if (colIndex === 0) {
    cellLeftBorderToCollapse += this.tableNode.borders.left;
    cellLeftBorderToCollapse += rowNode.borders.left;
  } else {
    cellLeftBorderToCollapse += this.getCell(rowIndex, colIndex - 1).cellNode.borders.right;
  }
  cellNode.borders.left -= _.min([cellNode.borders.left, cellLeftBorderToCollapse]);

  // collapse top border
  var cellTopBorderToCollapse = rowNode.borders.top;
  if (rowIndex === 0) {
    cellTopBorderToCollapse += this.tableNode.borders.top;
  } else {
    cellTopBorderToCollapse += this.getRow(rowIndex - 1).rowNode.borders.bottom;
    if (cellNode.colspan > 1) {
      var colspanBorderbottoms = [];
      for (var spanIndex = 0; spanIndex < cellNode.colspan; spanIndex++) {
        colspanBorderbottoms.push(this.getCell(rowIndex - 1, colIndex + spanIndex).cellNode.borders.bottom);
      }
      cellTopBorderToCollapse += _.min(colspanBorderbottoms);
    } else {
      let upperCell = this.getCell(rowIndex - 1, colIndex);
      if (upperCell) {
        cellTopBorderToCollapse += upperCell.cellNode.borders.bottom;
      }
    }
  }
  cellNode.borders.top -= _.min([cellNode.borders.top, cellTopBorderToCollapse]);

  // collapse right border
  if (colIndex === this.colCount - 1 || (colIndex + cellNode.colspan) === this.colCount) {
    var cellRightBorderToCollapse = rowNode.borders.right + this.tableNode.borders.right;
    cellNode.borders.right -= _.min([cellNode.borders.right, cellRightBorderToCollapse]);
  }

  // collapse bottom border
  var cellBottomBorderToCollapse = rowNode.borders.bottom;
  if (rowIndex === this.rowCount - 1) {
    cellBottomBorderToCollapse += this.tableNode.borders.bottom;
  } else {
    // WARNING NOT DEFINED (ALL ROWS should be parsed before cells)
    cellBottomBorderToCollapse += this.getRow(rowIndex + 1).rowNode.borders.top;
  }
  cellNode.borders.bottom -= _.min([cellNode.borders.bottom, cellBottomBorderToCollapse]);

  var cell = {
    colIndex,
    cellNode
  };

  // create container
  if (width === 'colspan' || width === '*' || width === 'auto') {
    cell.container = new Container(cellNode, [rowNode.availableWidth, Infinity]);
  } else {
    if (colIndex === 0) {
      width = width - rowNode.margins.left - rowNode.borders.left;
    } else if (colIndex === (this.colCount -1)) {
      width = width - rowNode.margins.right - rowNode.borders.right;
    }
    cell.container = new Container(cellNode, [width, Infinity]);
  }
  // process auto and fixed width
  if (width !== '*' && width !== 'colspan') {
    var cellContext = {
      parent: cell.container,
      parentStyle: cellNode,
      document: this.document
    };
    var cellProcessor = new this.Processor(cellContext, content);
    cellProcessor.process();
  }

  return cell;
};

tableMatrix.prototype.getCell = function(rowIndex, colIndex) {
  return this.getRow(rowIndex).cells[colIndex];
};

module.exports = function(Processor, document, parent, node) {
  var table = new tableMatrix(node, parent, document, Processor);
  return table.container;
};
