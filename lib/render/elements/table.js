var _ = require('lodash');
var Container = require('../container');
var utils = require('../utils');

var id = 0;
var tableMatrix = function(node, parent, document, Processor) {
  var self = this;
  this.id = node.id = node.id || 'table_' + id++;
  this.tableNode = node;
  this.document = document;
  this.Processor = Processor;
  this.matrix = [];
  this.colspans = [];

  // define widths
  this.tableNode.width = utils.parseDimension(parent.getAvailableWidth(), this.tableNode.width);
  this.tableNode.availableWidth = node.width - node.margins.left - node.margins.right - node.borders.left - node.borders.right;
  this.tableNode.widths = this.tableNode.widths || [];

  // remove elements that aren't row in table
  this.tableNode.content = _.filter(this.tableNode.content, function(b) { return b.tag === "row"; });

  // set column and row count
  this.rowCount = this.tableNode.content.length;
  this.colCount = _.max(_.map(this.tableNode.content, function(b) { return b.content.length; }));

  // normalize columns widths
  this.normalizeWidths();

  // check repeatHeader attribute
  if (this.tableNode.repeatHeader) {
    this.headers = [];
  }

  // add all rows
  this.tableNode.content.forEach(function(rowNode) {
    self.addRow(rowNode);
  });
  // add cells
  this.tableNode.content.forEach(function(rowNode, rowIndex) {
    var row = self.getRow(rowIndex);
    var colIndex = 0;
    rowNode.content.forEach(function(cellNode) {
      // skip already defined colIndex by rowspan
      while (row.cells[colIndex]) {
        colIndex++;
      }
      var cell = self.addCell(rowIndex, colIndex, cellNode);
      row.cells[colIndex] = cell;
      if (cell.cellNode.colspan > 1 && cell.cellNode.rowspan > 1) {
        self.colspans.push({colIndex, rowIndex});
        for (let rowspan = 1; rowspan <= cell.cellNode.rowspan; rowspan++) {
          for (let colspan = 1; colspan <= cell.cellNode.colspan; colspan++) {
            if (rowspan === 1 && colspan === 1) {
              continue;
            }
            var colrowspanCell = _.clone(cell);
            colrowspanCell.colspan = colspan;
            colrowspanCell.rowspan = rowspan;
            let colspanIndex = colIndex + colspan - 1;
            let rowspanIndex = rowIndex + rowspan - 1;
            let row = self.getRow(rowspanIndex);
            if (row) {
              row.cells[colspanIndex] = colrowspanCell;
            }
          }
        }
        colIndex += cell.cellNode.colspan - 1;
      } else if (cell.cellNode.colspan > 1) {
        self.colspans.push({colIndex, rowIndex});
        for (let colspan = 2; colspan <= cell.cellNode.colspan; colspan++) {
          let colspanCell = _.clone(cell);
          colspanCell.colspan = colspan;
          let colspanIndex = colIndex + colspan - 1;
          row.cells[colspanIndex] = colspanCell;
        }
        colIndex += cell.cellNode.colspan - 1;
      } else if (cell.cellNode.rowspan > 1) {
        for (let rowspan = 2; rowspan <= cell.cellNode.rowspan; rowspan++) {
          let rowspanCell = _.clone(cell);
          rowspanCell.rowspan = rowspan;
          let rowspanIndex = rowIndex + rowspan - 1;
          let row = self.getRow(rowspanIndex);
          if (row) {
            row.cells[colIndex] = rowspanCell;
          }
        }
      }
      colIndex++;
    });
  });

  // define auto width columns
  this.setAutoWidthCellWidth();

  // define star width columns
  this.setStarWidthCellWidth();

  // process colspans
  this.processColspans();

  // set rows height
  this.setRowsHeight();

  // set cells height
  this.setCellsHeight();

  // build rows
  var rows = this.buildRows();

  // build headers container for repeatHeader
  this.buildRepeatHeaders();

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

tableMatrix.prototype.normalizeWidths = function() {
  var self = this;
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
};

tableMatrix.prototype.addRow = function(rowNode) {
  var rowIndex = this.matrix.length;
  // set id
  rowNode.id = rowNode.id || this.id + '_row' + rowIndex;
  //set width
  rowNode.width = this.tableNode.availableWidth;

  rowNode.addClass('row');
  this.tableNode.append(rowNode);

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
  cellNode.id = cellNode.id || rowNode.id + '_cell' + colIndex;
  // set width
  var width = this.tableNode.widths[colIndex];
  if (cellNode.colspan && cellNode.colspan > 1) {
    width = 'colspan';
  }
  if (cellNode.tag === "header") {
    cellNode.addClass('header');
    if (this.headers) {
      this.headers.push({
        colIndex,
        rowIndex
      });
    }
  } else {
    if (rowIndex % 2) {
      cellNode.addClass('row_even');
    } else {
      if (!_.isFunction(cellNode.addClass)) {
        throw new Error('not elem ' + JSON.stringify(cellNode));
      }
      cellNode.addClass('row_odd');
    }
  }
  cellNode.addClass('cell');
  rowNode.append(cellNode);
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
        let cell = this.getCell(rowIndex - 1, colIndex + spanIndex);
        if (cell) {
          colspanBorderbottoms.push(cell.cellNode.borders.bottom);
        }
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
    var cellProcessor = new this.Processor(cellContext, cellNode.content);
    cellProcessor.process();
  }

  return cell;
};

tableMatrix.prototype.getCell = function(rowIndex, colIndex) {
  return this.getRow(rowIndex).cells[colIndex];
};

tableMatrix.prototype.setAutoWidthCellWidth = function() {
  var self = this;
  this.tableNode.widths.forEach(function(width, colIndex) {
    if (width === 'auto') {
      var autoWidths = [0];
      var marginsBorders = [0];
      // get each cell width to define the max one
      for (let rowIndex = 0; rowIndex < self.rowCount; rowIndex++) {
        let cell = self.getCell(rowIndex, colIndex);
        if (!cell || cell.cellNode.colspan || cell.colspan || cell.rowspan) {
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
        if (!cell || cell.cellNode.colspan || cell.colspan || cell.rowspan) {
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
};

tableMatrix.prototype.setStarWidthCellWidth = function() {
  var self = this;
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
        if (!cell || cell.cellNode.colspan || cell.colspan || cell.rowspan) {
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
        var cellContext = {
          parent: cell.container,
          parentStyle: cell.cellNode,
          document: self.document
        };
        var cellProcessor = new self.Processor(cellContext, cell.cellNode.content);
        cellProcessor.process();
      }
    }
  });
};

tableMatrix.prototype.processColspans = function() {
  var self = this;
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
    var cellContext = {
      parent: cell.container,
      parentStyle: cell.cellNode,
      document: self.document
    };
    var cellProcessor = new self.Processor(cellContext, cell.cellNode.content);
    cellProcessor.process();
  });
};

tableMatrix.prototype.setRowsHeight = function() {
  var self = this;
  var rowspanHeights = [];
  for (var rowIndex = 0; rowIndex < this.rowCount; rowIndex++) {
    // get row's cell max height
    var heights = [];
    for (let colIndex = 0; colIndex < this.colCount; colIndex++) {
      let cell = this.getCell(rowIndex, colIndex);
      if (cell) {
        if (cell.cellNode && cell.cellNode.rowspan > 1 && !cell.rowspan) {
          rowspanHeights.push({
            rowIndex,
            rowspan: cell.cellNode.rowspan,
            height: _.max([cell.cellNode.height, cell.container.getMinHeight()])
          });
        } else if (!cell.rowspan && !cell.colspan) {
          heights.push(_.max([cell.cellNode.height, cell.container.getMinHeight()]));
        }
      }
    }
    var maxHeight = _.max(heights);
    var row = this.getRow(rowIndex);
    var rowNode = row.rowNode;
    rowNode.width = this.tableNode.availableWidth;
    if (_.isUndefined(rowNode.height)) {
      // default star height row
      rowNode.availableHeight = maxHeight;
      rowNode.height = rowNode.availableHeight + rowNode.margins.top + rowNode.margins.bottom + rowNode.borders.top + rowNode.borders.bottom;
      row.height = '*';
    } else {
      // fixed height row
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
      row.height = rowHeight;
      rowNode.availableHeight = rowNode.height - rowNode.margins.top - rowNode.margins.bottom - rowNode.borders.top - rowNode.borders.bottom;
    }
  }
  // check all rowspan can fit in rows heights
  rowspanHeights.forEach(function(rowspan) {
    var rows = [];
    // calculate sum rows height
    var rowsHeight = 0;
    for (let rowIndex = rowspan.rowIndex; rowIndex < rowspan.rowIndex + rowspan.rowspan; rowIndex++) {
      let row = self.getRow(rowIndex);
      if (row && row.rowNode && row.rowNode.height) {
        rowsHeight += row.rowNode.height;
        rows.push(row);
      }
    }
    if (rowsHeight < rowspan.height) {
      // rows must be resized
      let HeightForStars = rowspan.height - rowsHeight;
      // define height to add on each star height
      let starCount = _.filter(rows, function(r) { return r.height === '*'; }).length;
      let starAddHeight = HeightForStars / starCount;
      // update rows height
      rows.forEach(function(row) {
        if (row.height === '*') {
          let rowNode = row.rowNode;
          rowNode.height += starAddHeight;
          rowNode.availableHeight = rowNode.height - rowNode.margins.top - rowNode.margins.bottom - rowNode.borders.top - rowNode.borders.bottom;
        }
      });
    }
  });
};

tableMatrix.prototype.setCellsHeight = function() {
  for (var rowIndex = 0; rowIndex < this.rowCount; rowIndex++) {
    for (let colIndex = 0; colIndex < this.colCount; colIndex++) {
      let cell = this.getCell(rowIndex, colIndex);
      if (cell && cell.container) {
        if (cell.colspan || cell.rowspan) {
          continue;
        } else if (!cell.cellNode.rowspan) {
          let row = this.getRow(rowIndex);
          if (row && row.rowNode) {
            cell.container.setHeight(row.rowNode.availableHeight);
          }
        } else {
          let cellHeight = 0;
          for (let rowspan = 0; rowspan < cell.cellNode.rowspan; rowspan++) {
            let row = this.getRow(rowIndex + rowspan);
            if (row && row.rowNode) {
              cellHeight += row.rowNode.availableHeight;
              if (rowspan !== 0) {
                cellHeight += row.rowNode.borders.top;
                cellHeight += row.rowNode.margins.top;
              }
              if (rowspan !== cell.cellNode.rowspan - 1) {
                cellHeight += row.rowNode.borders.bottom;
                cellHeight += row.rowNode.margins.bottom;
              }
            }
          }
          cell.container.setHeight(cellHeight);
        }
      }
    }
  }
};

tableMatrix.prototype.buildRows = function() {
  var self = this;
  // create arrays(groups) of containers with contigous cells grouped by rowspan value per row
  var rowsGroups = [];
  for (let rowIndex = 0; rowIndex < this.rowCount; rowIndex++) {
    rowsGroups[rowIndex] = [];

    // get current rowNode to apply margins and borders
    let rowNode = this.getRow(rowIndex).rowNode;
    // create an empty node to handle margins and borders
    let chunkNode = {
      borders: {},
      margins: {}
    };

    // is row unbreakable ?
    if (rowNode.unbreakable) {
      chunkNode.unbreakable = true;
    }

    // top borders and margins must be applyed in all cases
    chunkNode.borders.top = rowNode.borders.top;
    chunkNode.margins.top = rowNode.margins.top;

    // start creating groups
    var groupId = 0;
    for (let colIndex = 0; colIndex < this.colCount; colIndex++) {
      let cell = this.getCell(rowIndex, colIndex);
      if (!cell) {
        continue;
      }
      // do not process duplicate cells
      if (cell.rowspan || cell.colspan) {
        if (cell.rowspan && rowsGroups[rowIndex][groupId]) {
          groupId++;
        }
        continue;
      }
      var rowspan = cell.cellNode.rowspan || 1;

      // apply left margins and borders on left side (colIndex===0)
      if (colIndex === 0) {
        chunkNode.borders.left = rowNode.borders.left;
        chunkNode.margins.left = rowNode.margins.left;
      } else {
        chunkNode.borders.left = 0;
        chunkNode.margins.left = 0;
      }

      // apply bottom margins and borders
      if (rowspan === 1) {
        // no rowspan(1) so this is the same row
        chunkNode.borders.bottom = rowNode.borders.bottom;
        chunkNode.margins.bottom = rowNode.margins.bottom;
      } else {
        // get last row of rowspan
        let row = this.getRow(rowIndex + rowspan - 1);
        if (row) {
          chunkNode.borders.bottom = row.rowNode.borders.bottom;
          chunkNode.margins.bottom = row.rowNode.margins.bottom;
        }
      }

      // create current group if not exist
      if (!rowsGroups[rowIndex][groupId]) {
        rowsGroups[rowIndex][groupId] = {
          rowIndex,
          groupId,
          colIndex,
          colSize: 0,
          rowspan,
          container: new Container(chunkNode, [Infinity, Infinity])
        };
      }
      // rowspan has change, so move to next group
      if (rowsGroups[rowIndex][groupId].rowspan !== rowspan) {
        groupId++;
        rowsGroups[rowIndex][groupId] = {
          rowIndex,
          groupId,
          colIndex,
          colSize: 0,
          rowspan,
          container: new Container(chunkNode, [Infinity, Infinity])
        };
      }

      // insert cell in current group
      rowsGroups[rowIndex][groupId].container.insert(cell.container);

      // update group column size
      if (cell.cellNode.colspan > 1) {
        rowsGroups[rowIndex][groupId].colSize += cell.cellNode.colspan;
      } else {
        rowsGroups[rowIndex][groupId].colSize++;
      }
    }

    // apply right margins and borders on last row's group
    let lastGroup = _.last(rowsGroups[rowIndex]);
    if (lastGroup.colIndex + lastGroup.colSize === this.colCount) {
      lastGroup.container.borders.right = rowNode.borders.right;
      lastGroup.container.margins.right = rowNode.margins.right;
    }

    // resize all row's group to the minimal size
    rowsGroups[rowIndex].forEach(function(rowGroup, groupId) {
      rowGroup.container.setHeight(rowGroup.container.getMinHeight());
      rowGroup.container.setWidth(rowGroup.container.getMinWidth());
      rowGroup.container.id = self.id + '_group' + rowIndex + '_' + groupId;
    });
  }

  // create an array to return rows' containers
  var rows = [];

  // iterate all rows
  var rowIndex = 0;
  while (rowIndex < rowsGroups.length) {
    let rowGroups = rowsGroups[rowIndex];

    // if row contains no rowspan, push row and move to next one
    if (rowGroups.length === 1 && rowGroups[0].rowspan === 1) {
      rowGroups[0].container.lineEnd = true;
      rows.push(rowGroups[0].container);
      rowIndex++;
      continue;
    }

    // detect how many rows must be concat
    let rowToConcat = 1;
    let nextRowToCheck = 1;
    let checkingRowIndex = rowIndex;
    while (nextRowToCheck > 0) {
      let checkingRow = rowsGroups[checkingRowIndex];
      let maxRowspan = _.max(_.map(checkingRow, 'rowspan'));
      if (maxRowspan > 1) {
        rowToConcat++;
        nextRowToCheck += maxRowspan - 1;
      }
      nextRowToCheck--;
      checkingRowIndex++;
    }

    // create a chunk of rows groups with rows to concat
    var chunk = rowsGroups.slice(rowIndex, rowIndex + rowToConcat);

    // concat the row, push row and move to next one
    let row = this.concatRow(chunk);
    row.lineEnd = true;
    rows.push(row);
    rowIndex += rowToConcat;
  }

  // return an array of rows container
  return rows;
};

// concat recursively rows by reducing chunk in a same height elements
tableMatrix.prototype.concatRow = function(chunk) {
  var self = this;

  // create a container to return
  var groupContainer = new Container({}, Infinity, Infinity);

  // check if chunk could be troncate horizontaly
  let groups = _.flatten(chunk);

  // set container id
  groupContainer.id = 'concatRow';
  groups.forEach(function(group) {
    groupContainer.id += '_' + group.rowIndex + '-' + group.groupId;
  });

  let colIndexes = _.uniq(_.map(groups, 'colIndex'));
  let minColIndex = _.min(colIndexes);
  let cutIndex = _.find(colIndexes, function(cut) {
    if (cut === minColIndex) {
      return false;
    }
    let applyable = true;
    for (let group of groups) {
      if (group.colIndex < cut && group.colIndex + group.colSize > cut) {
        applyable = false;
        break;
      }
    }
    return applyable;
  });

  // insert horizontaly
  if (cutIndex) {
    let rowsA = [];
    let rowsB = [];
    chunk.forEach(function(row) {
      let groupsA = [];
      let groupsB = [];
      row.forEach(function(group) {
        if (group.colIndex >= cutIndex) {
          // if group column index is upper than the cut index push it in group B
          groupsB.push(group);
        } else if (group.colIndex < cutIndex) {
          // if group column index is smaller than the cut index push it in group A
          groupsA.push(group);
        }
      });
      rowsA.push(groupsA);
      rowsB.push(groupsB);
    });
    // insert groups A and groups B horizontaly
    groupContainer.insert(this.concatRow(rowsA));
    groupContainer.insert(this.concatRow(rowsB));

  } else {
    // insert row verticaly
    let rows = [];
    var prevColspan = 0;
    chunk.forEach(function(groups) {
      if (prevColspan > 0) {
        prevColspan--;
      }
      if (groups.length === 1 && prevColspan === 0) {
        if (rows.length) {
          let rowsContainer = self.concatRow(rows);
          rowsContainer.lineEnd = true;
          groupContainer.insert(rowsContainer);
          rows = [];
        }
        groups[0].container.lineEnd = true;
        groupContainer.insert(groups[0].container);
      } else if (groups.length) {
        rows.push(groups);
      }
      let rowColspan = _.max(_.map(groups, 'rowspan'));
      if (rowColspan > prevColspan) {
        prevColspan = rowColspan;
      }
    });
    // last rows
    if (rows.length) {
      let rowsContainer = self.concatRow(rows);
      rowsContainer.lineEnd = true;
      groupContainer.insert(rowsContainer);
    }
  }
  // resize the container to the minimal size and return
  groupContainer.setHeight(groupContainer.getMinHeight());
  groupContainer.setWidth(groupContainer.getMinWidth());
  return groupContainer;
};

tableMatrix.prototype.buildRepeatHeaders = function() {
  var self = this;
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
};

module.exports = function(Processor, document, parent, node) {
  var table = new tableMatrix(node, parent, document, Processor);
  return table.container;
};
