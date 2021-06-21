var _ = require('lodash');
var precision = 5;

var container = function(node, size) {
  this.id = 'container';
  if (node.id) {
    this.id = 'container_' + node.id;
  }
  // this.node = node;
  this.width = size[0];
  this.height = size[1];
  this.margins = _.clone(node.margins);
  this.borders = _.clone(node.borders);
  this.fillColor = node.fillColor;
  this.alignment = node.alignment || 'left';
  this.repeatOnBreak = node.repeatOnBreak || null;
  this.container = [];
  this.currentLine = new line();
  this.lines = [];
  this.empty = true;
};

container.prototype.getAvailableWidth = function() {
  return _.floor(this.width - this.margins.right - this.margins.left - this.borders.left - this.borders.right - this.currentLine.width, precision);
};

container.prototype.getAvailableHeight = function() {
  var linesHeight = _.sumBy(this.lines, 'height');
  return _.floor(this.height - this.margins.top - this.margins.bottom - this.borders.top - this.borders.bottom - linesHeight, precision);
};

container.prototype.setWidth = function(width) {
  this.width = width;
};

container.prototype.setHeight = function(height) {
  this.height = height;
};

container.prototype.getMinWidth = function() {
  var contents = _.clone(this.lines);
  contents.push(this.currentLine);
  return _.max(_.map(contents, 'width')) + this.margins.left + this.margins.right + this.borders.left + this.borders.right;
};

container.prototype.getMinHeight = function() {
  var contents = _.clone(this.lines);
  contents.push(this.currentLine);
  return _.sum(_.map(contents, 'height')) + this.margins.top + this.margins.bottom + this.borders.top + this.borders.bottom;
};

container.prototype.insert = function(node) {
  node.height = _.floor(node.height, precision);
  node.width = _.floor(node.width, precision);

  var availableWidth = this.getAvailableWidth();
  if (node.width > availableWidth) {
    this.endOfLine();
  }

  var availableHeight = this.getAvailableHeight();
  if (node.height > availableHeight) {
    if (node instanceof container && !node.unbreakable) {
      this.insert(node.break(availableHeight));
    }
    return false;
  }
  this.empty = false;
  this.currentLine.insert(node);

  if (node.lineEnd) {
    this.endOfLine();
  }

  return true;
};

container.prototype.endOfLine = function() {
  this.lines.push(this.currentLine);
  this.currentLine = new line();
};

container.prototype.buildBorders = function() {
  if (this.borders.left > 0) {
    this.container.unshift({
      id: this.id + '_border_left',
      line: {
        to: {
          x: 0,
          y: this.height
        },
        'stroke-width': this.borders.left,
      },
      x: this.borders.left / 2,
      y: 0,
      stroke: [0, 0, 0]
    });
  }
  if (this.borders.top > 0) {
    this.container.unshift({
      id: this.id + '_border_top',
      line: {
        to: {
          x: this.width,
          y: 0
        },
        'stroke-width': this.borders.top
      },
      x: 0,
      y: this.borders.top / 2,
      stroke: [0, 0, 0]
    });
  }
  if (this.borders.right > 0) {
    this.container.unshift({
      id: this.id + '_border_right',
      line: {
        to: {
          x: 0,
          y: this.height
        },
        'stroke-width': this.borders.right
      },
      x: this.width - (this.borders.right / 2),
      y: 0,
      stroke: [0, 0, 0]
    });
  }
  if (this.borders.bottom > 0) {
    this.container.unshift({
      id: this.id + '_border_botom',
      line: {
        to: {
          x: this.width,
          y: 0
        },
        'stroke-width': this.borders.bottom
      },
      x: 0,
      y: this.height - (this.borders.bottom / 2),
      stroke: [0, 0, 0]
    });
  }
};

container.prototype.buildBackground = function() {
  if (this.fillColor === 'none') {
    return;
  }
  this.container.unshift({
    rect: {
      fill: this.fillColor,
      width: this.width,
      height: this.height
    },
    x: 0,
    y: 0
  });
};

container.prototype.end = function() {
  var self = this;
  if (this.currentLine) {
    this.lines.push(this.currentLine);
  }
  var y = this.margins.top + self.borders.top;
  this.lines.forEach(function(line) {
    // handle alignment
    var alignment = line.alignment || self.alignment;
    var x = self.margins.left + self.borders.left;
    if (alignment === 'right') {
      x = self.width - self.margins.right - self.borders.right - line.width;
    } else if (alignment === 'center') {
      x = self.margins.left + ((self.width - self.margins.left - self.margins.right - self.borders.left - self.borders.right - line.width) / 2);
    }
    line.content.forEach(function(LineNode) {
      LineNode.alignment = alignment;
      LineNode.x = x;
      LineNode.y = y;
      if (LineNode instanceof container) {
        LineNode.buildBorders();
        LineNode.buildBackground();
        LineNode.end();
        LineNode.container.forEach(function(containerNode) {
          containerNode.x += LineNode.x;
          containerNode.y += LineNode.y;
          self.container.push(containerNode);
        });
      } else if (!LineNode.spacer) {
        self.container.push(LineNode);
      }
      x += LineNode.width;
    });
    y += line.height;
  });
};

// return a new container that fit in height and reduce current instance
container.prototype.break = function(height) {
  var currentHeight = 0;
  var currentLineIndex = 0;
  var lineCutIndex = null;
  var currentLine = null;
  var lineBreak = 0;
  this.endOfLine();
  while ((currentHeight < height) && (currentLineIndex < this.lines.length) && lineBreak === 0) {
    currentLine = this.lines[currentLineIndex];
    if (currentHeight + currentLine.height < height) {
      lineCutIndex = currentLineIndex;
      currentHeight += currentLine.height;
      currentLineIndex++;
    } else {
      lineBreak = height - currentHeight;
    }
  }

  // do not break a line for less than 50
  var fitLine = null;
  if (lineBreak > 50) {
    fitLine = new line();
    var indexItem = 0;
    var lineHeight = 0;
    while (lineHeight < lineBreak && indexItem < currentLine.content.length) {
      var lineItem = currentLine.content[indexItem];
      var item;
      if (lineItem instanceof container) {
        item = lineItem.break(lineBreak);
      } else if (lineItem.spacer) {
        item = _.clone(lineItem);
      } else {
        item = lineItem;
        delete currentLine.content[indexItem];
      }
      fitLine.insert(item);
      indexItem++;
    }
    currentLine.update();
  }

  if (_.isNull(lineCutIndex) && (_.isNull(fitLine) || fitLine.content.length === 0)) {
    this.unbreakable = true;
    return this;
  }

  var lines = this.lines;
  // update current instance
  if (!_.isNull(lineCutIndex)) {
    this.lines = lines.slice(lineCutIndex + 1);
  }

  if (this.repeatOnBreak) {
    var reapeatLine = new line();
    reapeatLine.insert(this.repeatOnBreak.clone());
    this.lines.unshift(reapeatLine);
  }

  this.setHeight(this.getMinHeight());
  // create a new container
  var fitContainer = new container(this, [this.width, Infinity]);

  if (!_.isNull(lineCutIndex)) {
    fitContainer.lines = lines.slice(0, lineCutIndex + 1);
  }

  if (fitLine) {
    fitContainer.lines.push(fitLine);
  }

  fitContainer.borders.bottom = 0;
  fitContainer.setHeight(fitContainer.getMinHeight());
  return fitContainer;
};

container.prototype.clone = function() {
  var clone = new container(this, [this.width, this.height]);
  // for each line
  this.lines.forEach(function(cloningLine) {
    cloningLine.content.forEach(function(lineContent) {
      var cloneLine = new line();
      if (lineContent instanceof container) {
        cloneLine.insert(lineContent.clone());
      } else {
        cloneLine.insert(_.cloneDeep(lineContent));
      }
      clone.lines.push(cloneLine);
    });
  });
  // for currentLine
  this.currentLine.content.forEach(function(lineContent) {
    if (lineContent instanceof container) {
      clone.currentLine.insert(lineContent.clone());
    } else {
      clone.currentLine.insert(_.cloneDeep(lineContent));
    }
  });
  return clone;
};

module.exports = container;

var line = function() {
  this.width = 0;
  this.height = 0;
  this.content = [];
  this.alignment = null;
};

line.prototype.insert = function(node) {
  this.width += node.width;
  this.height = _.max([this.height, node.height]);
  if (node.alignment) {
    this.alignment = node.alignment;
  }
  // group text line
  var last = _.last(this.content);
  if (last && !_.isUndefined(node.text) && !_.isUndefined(last.text) && node.textId === last.textId) {
    last.text += node.text;
    last.width += node.width;
  } else {
    this.content.push(node);
  }
};

line.prototype.update = function() {
  var self = this;
  this.width = 0;
  this.height = 0;
  this.content.forEach(function(node) {
    self.width += node.width;
    self.height = _.max([self.height, node.height]);
  });
};
