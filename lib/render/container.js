var _ = require('lodash');
var precision = 5;

var container = function(node, size) {
  if (!this.id) {
    if (node.id && node.id !== 'container') {
      this.id = this.id = 'container_' + node.id;
    } else {
      this.id = 'container';
    }
  }
  // this.node = node;
  this.width = size[0];
  this.height = size[1];
  if (node.margins) {
    this.margins = {
      left: node.margins.left || 0,
      top: node.margins.top || 0,
      bottom: node.margins.bottom || 0,
      right: node.margins.right || 0
    };
  } else {
    this.margins = {
      left: 0,
      top: 0,
      bottom: 0,
      right: 0
    };
  }
  if (node.borders) {
    this.borders = {
      left: node.borders.left || 0,
      top: node.borders.top || 0,
      bottom: node.borders.bottom || 0,
      right: node.borders.right || 0
    };
  } else {
    this.borders = {
      left: 0,
      top: 0,
      bottom: 0,
      right: 0
    };
  }
  this.fillColor = node.fillColor || 'none';
  this.alignment = node.alignment || 'left';
  this.repeatOnBreak = node.repeatOnBreak || null;
  this.unbreakable = node.unbreakable || false;
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

// recursively update first line height on containers to keep tables borders alignment
container.prototype.expandTop = function(height) {
  let delta = height - this.getMinHeight();
  if (this.lines[0] && delta) {
    this.lines[0].content.forEach(function(lineItem) {
      if (lineItem instanceof container) {
        lineItem.expandTop(lineItem.height + delta);
      }
    });
    this.lines[0].height += delta;
  }
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
      var chunk = node.break(availableHeight);
      if (chunk !== false) {
        this.insert(chunk);
      }
    } else if (node.spacer) {
      node.height = node.height - availableHeight;
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
        stroke: [0, 0, 0]
      },
      x: this.borders.left / 2,
      y: 0
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
        'stroke-width': this.borders.top,
        stroke: [0, 0, 0]
      },
      x: 0,
      y: this.borders.top / 2
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
        'stroke-width': this.borders.right,
        stroke: [0, 0, 0]
      },
      x: this.width - (this.borders.right / 2),
      y: 0
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
        'stroke-width': this.borders.bottom,
        stroke: [0, 0, 0]
      },
      x: 0,
      y: this.height - (this.borders.bottom / 2)
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

// return a new container that fit in height and reduce current instance or return false if unbreakable
container.prototype.break = function(height, inlined) {
  // fill empty height space to keep height proportions
  var minHeight = this.getMinHeight();
  if (this.height > minHeight) {
    this.insert({
      spacer: true,
      height: this.height - minHeight
    });
  }

  // remove the border top and margin top of the wanted height (bottoms are removed from break)
  var breakingHeight = height - this.borders.top - this.margins.top;
  var chunkHeight = 0;
  var currentLineIndex = 0;
  var lineCutIndex = null;
  var currentLine = this.lines[currentLineIndex];
  var breaking = true;
  // close current line
  this.endOfLine();
  // detect how many full lines fit on current page
  while ((chunkHeight < breakingHeight) && (currentLineIndex < this.lines.length) && breaking) {
    currentLine = this.lines[currentLineIndex];
    if (chunkHeight + currentLine.height < breakingHeight) {
      lineCutIndex = currentLineIndex;
      chunkHeight += currentLine.height;
      currentLineIndex++;
    } else {
      // next line does not fit on line
      breaking = false;
    }
  }

  var lineBreak = breakingHeight - chunkHeight;

  // do not break a line for less than 50
  var lineChunk = null;
  if (lineBreak > 50 || inlined) {
    // create a new line for the chunk
    lineChunk = new line();
    var lineBreakable = true;
    var lineRemoveables = [];
    var lineContainers = [];
    var indexItem = 0;
    while ((indexItem < currentLine.content.length) && lineBreakable) {
      var lineItem = currentLine.content[indexItem];
      var item;

      if (lineItem.height < lineBreak) {
        // detect elements that fully fit on current page
        item = lineItem;
        lineRemoveables.push(indexItem);
      } else if (lineItem.spacer) {
        // spacer can be slice at the exact height
        item = _.clone(lineItem);
        if (lineItem.height) {
          let initialHeight = lineItem.height;
          lineItem.height = initialHeight - lineBreak;
          item.height = lineBreak;
        }
      } else if (lineItem instanceof container) {
        // container could be breaken to fit on page
        item = lineItem.break(lineBreak, true);
        lineContainers.push({chunk: item, staying: lineItem});
        if (item === false) {
          // this container cannot be broken in this height so line is unbreakable
          lineBreakable = false;
          continue;
        }
      } else {
        // other element that not fit on page so line is unbreakable
        lineBreakable = false;
        continue;
      }
      // insert element that fit on page in the chunk line
      lineChunk.insert(item);
      // go to next element
      indexItem++;
    }

    if (lineBreakable) {
      // remove elements that fit on current page
      lineRemoveables.forEach(function(indexItem) {
        delete currentLine.content[indexItem];
      });

      // detect the max height of the line contents for next page
      var maxStayingHeight = _.max(_.map(lineContainers, function(breakContainer) { return breakContainer.staying.height; }));

      // resize container to the same height to keep alignment
      lineContainers.forEach(function(breakContainer) {
        // expand top to keep table borders alignment
        breakContainer.staying.expandTop(maxStayingHeight);
        breakContainer.chunk.setHeight(lineBreak);
      });
      // update the line chunk height
      lineChunk.update();
      // add line height to the chunk height
      chunkHeight += lineChunk.height;
      // update next page first line height
      currentLine.update();
    } else {
      // line is unbreakable
      lineChunk = null;
    }
  }
  // if no content could be break return false
  if (chunkHeight === 0) {
    return false;
  }

  // save current block lines
  var lines = this.lines;

  // remove full lines than fit in current page
  if (!_.isNull(lineCutIndex)) {
    this.lines = lines.slice(lineCutIndex + 1);
  }

  // insert content that must be repeat to the next page
  if (this.repeatOnBreak) {
    var reapeatLine = new line();
    reapeatLine.insert(this.repeatOnBreak.clone());
    this.lines.unshift(reapeatLine);
  }

  // create a new container for the chunk that fit in current page
  var chunkContainer = new container(this, [this.width, Infinity]);

  // set next page content height to minimal height
  this.setHeight(this.getMinHeight());

  // add full lines that fit on page to the chunk
  if (!_.isNull(lineCutIndex)) {
    chunkContainer.lines = lines.slice(0, lineCutIndex + 1);
  }

  // add the line than was breaked
  if (lineChunk) {
    chunkContainer.lines.push(lineChunk);
  }

  // set chunk container height to chunk height and add top margin and top border
  chunkContainer.setHeight(chunkHeight + this.borders.top + this.margins.top);

  // remove top border and top margin to content in next page
  this.borders.top = 0;
  this.margins.top = 0;

  // remove bottom border and bottom margin to chunk
  chunkContainer.borders.bottom = 0;
  chunkContainer.margins.bottom = 0;

  // throw an Error instead of crash with and inifinite loop
  if (chunkHeight > breakingHeight) {
    throw new Error('chunk height ' + chunkHeight + ' upper than breakingHeight ' + breakingHeight);
  }

  // update containers id
  chunkContainer.id = this.id + '_part1';
  this.id += '_part2';

  return chunkContainer;
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
