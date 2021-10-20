var _ = require('lodash');
var Element = require('./element');
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
  this.alignment = node.alignment || null;
  this.valignment = node.valignment || null;
  this.fillColor = node.fillColor || 'none';
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

// recursively increase first line height on containers to keep tables borders alignment
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
  // avoid rounding errors
  if ((node.height - availableHeight) > 1) {
    if (node instanceof container && !node.unbreakable) {
      var chunk = node.break(availableHeight);
      if (chunk !== false) {
        this.insert(chunk);
      }
    } else if (node.tag === "vspace") {
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
    let borderLeft = new Element('line');
    borderLeft.content = {
      to: {
        x: 0,
        y: this.height
      }
    };
    borderLeft['stroke-width'] = this.borders.left;
    borderLeft.stroke = [0, 0, 0];
    borderLeft.x = this.borders.left / 2;
    borderLeft.y = 0;
    this.container.unshift(borderLeft);
  }
  if (this.borders.top > 0) {
    let borderTop = new Element('line');
    borderTop.content = {
      to: {
        x: this.width,
        y: 0
      }
    };
    borderTop['stroke-width'] = this.borders.top;
    borderTop.stroke = [0, 0, 0];
    borderTop.x = 0;
    borderTop.y = this.borders.top / 2;
    this.container.unshift(borderTop);
  }
  if (this.borders.right > 0) {
    let borderRight = new Element('line');
    borderRight.content = {
      to: {
        x: 0,
        y: this.height
      }
    };
    borderRight['stroke-width'] = this.borders.right;
    borderRight.stroke = [0, 0, 0];
    borderRight.x = this.width - (this.borders.right / 2);
    borderRight.y = 0;
    this.container.unshift(borderRight);
  }
  if (this.borders.bottom > 0) {
    let borderBottom = new Element('line');
    borderBottom.content = {
      to: {
        x: this.width,
        y: 0
      }
    };
    borderBottom['stroke-width'] = this.borders.bottom;
    borderBottom.stroke = [0, 0, 0];
    borderBottom.x = 0;
    borderBottom.y = this.height - (this.borders.bottom / 2);
    this.container.unshift(borderBottom);
  }
};

container.prototype.buildBackground = function() {
  if (this.fillColor === 'none') {
    return;
  }
  let bg = new Element('rect');
  bg.fillColor = this.fillColor;
  bg.content = {
    width: this.width,
    height: this.height
  };
  bg.x = 0;
  bg.y = 0;
  this.container.unshift(bg);
};

container.prototype.end = function() {
  var self = this;

  // set the top position
  var y = this.margins.top + self.borders.top;
  // handle valignment
  if (this.valignment && this.valignment !== 'top') {
    // check free height space
    let freeHeight = this.height - this.getMinHeight();
    if (freeHeight > 0) {
      if (this.valignment === 'center') {
        // valignment center
        y += freeHeight / 2;
      } else if (this.valignment === 'bottom') {
        // valignment bottom
        y += freeHeight;
      }
    }
  }

  // push the current line to process it
  if (this.currentLine) {
    this.lines.push(this.currentLine);
  }
  // process all lines
  this.lines.forEach(function(line) {
    // handle alignment
    var alignment = line.alignment || self.alignment;
    // default left alignment
    var x = self.margins.left + self.borders.left;
    if (alignment === 'right') {
      // right alignment
      x = self.width - self.margins.right - self.borders.right - line.width;
    } else if (alignment === 'center') {
      // center alignment
      x = self.margins.left + ((self.width - self.margins.left - self.margins.right - self.borders.left - self.borders.right - line.width) / 2);
    }
    // position each content
    line.content.forEach(function(LineNode) {
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
      } else if (LineNode.tag !== "hspace" && LineNode.tag !== "vspace") {
        self.container.push(LineNode);
      }
      x += LineNode.width;
    });
    y += line.height;
  });
};

// check if container is breakable and return breakable info or false if unbreakable
container.prototype.isBreakable = function(height, inlined) {
  if (this.unbreakable) {
    return false;
  }

  var minHeight = this.getMinHeight();
  if (this.height > minHeight) {
    // handle valignment and fill empty height space to keep height proportions
    if (this.valignment === 'center') {
      let space = (this.height - minHeight) / 2;
      let upperLine = new line();
      let spacer = new Element('vspace');
      spacer.height = space;
      upperLine.insert(spacer);
      this.lines.unshift(upperLine);
      this.insert(spacer.clone());
    } else if (this.valignment === 'bottom') {
      let upperLine = new line();
      let spacer = new Element('vspace');
      spacer.height = this.height - minHeight;
      upperLine.insert(spacer);
      this.lines.unshift(upperLine);
    } else {
      let spacer = new Element('vspace');
      spacer.height = this.height - minHeight;
      this.insert(spacer);
    }
  }

  // remove the border top and margin top of the wanted height (bottoms are removed from break)
  var breakingHeight = height - this.borders.top - this.margins.top;
  if (breakingHeight <= 0) {
    return false;
  }
  var chunkHeight = 0;
  var currentLineIndex = 0;
  var splitLineIndex = null;
  var lines = _.clone(this.lines);
  lines.push(this.currentLine);
  var currentLine = lines[currentLineIndex];
  var breaking = true;
  // detect how many full lines fit on current page
  while ((chunkHeight < breakingHeight) && (currentLineIndex < lines.length) && breaking) {
    currentLine = lines[currentLineIndex];
    if (chunkHeight + currentLine.height < breakingHeight) {
      splitLineIndex = currentLineIndex;
      chunkHeight += currentLine.height;
      currentLineIndex++;
    } else {
      // next line does not fit on line
      breaking = false;
    }
  }
  var breakable = {
    splitLineIndex,
    height: chunkHeight,
    breakingHeight
  };
  var lineBreak = breakingHeight - chunkHeight;

  if (lineBreak > 50 || inlined) {
    let lineBreakable = currentLine.isBreakable(lineBreak);
    if (_.isNull(splitLineIndex) && !lineBreakable) {
      return false;
    }
    if (lineBreakable) {
      breakable.height += lineBreakable.height;
      breakable.line = lineBreakable;
    }
  } else if (_.isNull(splitLineIndex)) {
    return false;
  }

  return breakable;
};

container.prototype.troncate = function(breakable) {
  // create a new container for the chunk that fit in current page
  var chunkContainer = new container(this, [this.width, Infinity]);

  // close current line
  this.endOfLine();

  if (!_.isNull(breakable.splitLineIndex)) {
    // save current block lines
    let lines = this.lines;
    // remove full lines that fit on page in next page
    this.lines = lines.slice(breakable.splitLineIndex + 1);
    // add full lines that fit on page to the chunk
    chunkContainer.lines = lines.slice(0, breakable.splitLineIndex + 1);
  }

  // should we deeply break a line
  if (breakable.line) {
    let currentLine = this.lines[0];
    let chunkLine = currentLine.troncate(breakable.line);
    chunkContainer.lines.push(chunkLine);
  }

  // insert content that must be repeat to the next page
  if (this.repeatOnBreak) {
    var reapeatLine = new line();
    reapeatLine.insert(this.repeatOnBreak.clone());
    this.lines.unshift(reapeatLine);
  }

  // set next page content height to minimal height
  this.setHeight(this.getMinHeight());

  // set chunk container height to chunk height and add top margin and top border
  chunkContainer.setHeight(breakable.height + this.borders.top + this.margins.top);

  // remove top border and top margin to content in next page
  this.borders.top = 0;
  this.margins.top = 0;

  // remove bottom border and bottom margin to chunk
  chunkContainer.borders.bottom = 0;
  chunkContainer.margins.bottom = 0;

  // throw an Error instead of crash with and inifinite loop
  if (breakable.height > breakable.breakingHeight) {
    throw new Error('chunk height ' + breakable.height + ' upper than breakingHeight ' + breakable.breakingHeight);
  }

  // update containers id
  chunkContainer.id = this.id + '_part1';
  this.id += '_part2';

  return chunkContainer;
};

// return a new container that fit in height and reduce current instance or return false if unbreakable
container.prototype.break = function(height, inlined) {
  let breakable = this.isBreakable(height, inlined);
  if (!breakable) {
    return false;
  }
  // do not break on repeated headers only to avoid duplicate
  if (this.repeatOnBreak && breakable.height <= this.repeatOnBreak.height) {
    return false;
  }
  return this.troncate(breakable);
};

container.prototype.clone = function() {
  var clone = new container(this, [this.width, this.height]);
  // for each line
  this.lines.forEach(function(line) {
    clone.lines.push(line.clone());
  });
  // for currentLine
  clone.currentLine = this.currentLine.clone();
  clone.lineEnd = this.lineEnd;
  return clone;
};

module.exports = container;

var line = function() {
  this.width = 0;
  this.height = 0;
  this.content = [];
  this.alignment = null;
};

line.prototype.clone = function() {
  var clone = new line();
  clone.alignment = this.alignment;
  this.content.forEach(function(lineContent) {
    clone.insert(lineContent.clone());
  });
  return clone;
};

line.prototype.insert = function(node) {
  let lineWidth = this.width + (node.width || 0);
  if (_.isNaN(lineWidth)) {
    throw new Error('invalid node width');
  }
  this.width = lineWidth;
  this.height = _.max([this.height, node.height]);
  if (node.alignment) {
    this.alignment = node.alignment;
  }
  // group text line
  var last = _.last(this.content);
  if (last && node.tag === "text" && last.tag === "text" && node.textId === last.textId) {
    last.content += node.content;
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
    let lineWidth = self.width + (node.width || 0);
    if (_.isNaN(lineWidth)) {
      throw new Error('invalid line width');
    }
    self.width = lineWidth;
    self.height = _.max([self.height, node.height]);
  });
};

line.prototype.isBreakable = function(height) {
  let breakable = {
    moveables: {},
    containers: {},
    spacers: {},
    height: 0,
    breakingHeight: height
  };
  for (let index = 0; index < this.content.length; index++) {
    let node = this.content[index];
    let nodeHeight = 0;
    // spacers
    if (node.tag === "vspace") {
      if (node.height <= height) {
        // spacer is moveables
        breakable.moveables[index] = node;
        nodeHeight = node.height;
      } else {
        let chunkSpacer = new Element("vspace");
        chunkSpacer.height = height;
        let stayingSpacer = new Element("vspace");
        stayingSpacer.height = node.height - height;
        breakable.spacers[index] = {
          chunk: chunkSpacer,
          staying: stayingSpacer
        };
        nodeHeight = height;
      }
    } else if (node.tag === "hspace") {
      let spacer = new Element("hspace");
      spacer.width = node.width;
      breakable.spacers[index] = {
        chunk: spacer,
        staying: spacer.clone()
      };
    } else if (node.height <= height) {
      // moveables
      breakable.moveables[index] = node;
      nodeHeight = node.height;
    } else if (node instanceof container) {
      // containers
      breakable.containers[index] = node.isBreakable(height, true);
      if (!breakable.containers[index]) {
        return false;
      }
      nodeHeight = breakable.containers[index].height;
    } else {
      return false;
    }
    if (nodeHeight > breakable.height) {
      breakable.height = nodeHeight;
    }
  }
  return breakable;
};

line.prototype.troncate = function(breakable) {
  let self = this;
  let chunk = new line();
  for (let index = 0; index < this.content.length; index++) {
    if (breakable.moveables[index]) {
      chunk.insert(breakable.moveables[index]);
      delete this.content[index];
    } else if (breakable.spacers[index]) {
      chunk.insert(breakable.spacers[index].chunk);
      this.content[index] = breakable.spacers[index].staying;
    } else if (breakable.containers[index]) {
      let chunkContainer = this.content[index].troncate(breakable.containers[index]);
      // resize container to the same height to keep alignment
      chunkContainer.setHeight(breakable.breakingHeight);
      chunk.insert(chunkContainer);
    }
  }

  this.update();

  // resize container to the same height to keep alignment
  this.content.forEach(function(content) {
    if (content instanceof container) {
      content.expandTop(self.height);
    }
  });

  return chunk;
};
