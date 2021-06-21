var fs = require('fs');
var _ = require('lodash');
var LineBreaker = require('linebreak');
var style = require('./style');
var stack = require('./elements/stack');
var svg = require('./elements/svg');
var table = require('./elements/table');
var columns = require('./elements/columns');
var utils = require('./utils');

var elementId = 0;

var processor = function(context, nodes) {
  this.parent = context.parent;
  this.parentStyle = context.parentStyle || context.parent;
  this.document = context.document;
  if (!_.isArray(nodes)) {
    nodes = [nodes];
  }
  this.nodes = nodes;
};

processor.prototype.process = function() {
  var self = this;
  var nodes = [];
  this.nodes.forEach(function(node) {
    // cast node
    if (_.isUndefined(node)) {
      return;
    }
    if (_.isString(node)) {
      node = {text: node};
    } else if (_.isNumber(node)) {
      node = {text: node.toString()};
    }
    // node without style
    if (node.resetPageCount) {
      self.document.resetPageCount();
    } else if (node.pageBreak) {
      self.document.addPage();
    } else if (node.registerFont) {
      self.document.registerFont(node.registerFont, node);
    } else if (node.newClass) {
      self.document.addClass(node.newClass, node);
    } else {
      style(self.document, self.parentStyle, node);
      node.elementId = elementId++;
      // process node
      nodes = [];
      if (!_.isUndefined(node.text)) {
        nodes = self.text(node);
      } else if (node.image) {
        nodes = [self.image(node)];
      } else if (node.columns) {
        nodes = [columns(processor, self.document, self.parent, node)];
      } else if (node.table) {
        nodes = [table(processor, self.document, self.parent, node)];
      } else if (node.svg) {
        nodes = [svg(self.document, self.parent, node)];
      } else if (node.pageHeader) {
        self.document.setHeader(node);
      } else if (node.pageFooter) {
        self.document.setFooter(node);
      } else if (node.stack) {
        nodes = [stack(processor, self.document, self.parent, node)];
      } else if (node.spacer) {
        nodes = [node];
      }
      // insert in parent
      nodes.forEach(function(node) {
        self.parent.insert(node);
      });
    }
  });
};

processor.prototype.text = function(node) {
  node.id = 'text';
  if (!_.isString(node.text)) {
    return [];
  }
  node.text = node.text.replace(/\\n/gi, "\n");
  var breaker = new LineBreaker(node.text);
  var words = [];
  var bk = null;
  var last = 0;
  var lastWord;

  var fontFeatures = null;
  var font = this.document.getFont(node.font, node.bold, node.italics);
  var maxWidth = this.parent.getAvailableWidth();
  var textHeight = font.lineHeight(node.fontSize) * node.lineHeight;
  var fontName =  this.document.getFontName(node.font, node.bold, node.italics);

  if (node.text === '') {
    node.width = 0;
    node.height = textHeight;
    node.fontName = fontName;
    node.textId =  node.elementId;
    node.lineEnd = true;
    return [node];
  }

  while ((bk = breaker.nextBreak())) {
    var word = _.cloneDeep(node);
    word.text = node.text.slice(last, bk.position);
    if (word.text.endsWith('\n')) {
      word.text = word.text.slice(0,-1);
    }
    word.textId =  node.elementId;
    word.fontName = fontName;
    style(this.document, node, word);
    word.width = font.widthOfString(word.text, node.fontSize, fontFeatures) + ((node.characterSpacing || 0) * (word.text.length - 1));
    word.height = textHeight;
    if (word.width > maxWidth) {
      for (var i = 0; i < word.text.length; i++) {
        if ((word.text[i] === '\r' || word.text[i] === '\n') && lastWord) {
          lastWord.lineEnd = true;
          continue;
        }
        var char = _.cloneDeep(node);
        char.text = word.text[i];
        char.textId =  node.elementId;
        char.fontName = fontName;
        char.width = font.widthOfString(char.text, node.fontSize, fontFeatures);
        char.height = textHeight;
        char.id = 'char' + i;
        words.push(char);
        lastWord = char;
      }
      if (bk.required && lastWord) {
        lastWord.lineEnd = true;
      }
    } else {
      if (bk.required || word.text.match(/\r?\n$|\r$/)) { // new line
        word.text = word.text.replace(/\r?\n$|\r$/, '');
        word.lineEnd = true;
      }
      word.id = 'word' + bk.position;
      words.push(word);
      lastWord = word;
    }
    last = bk.position;
  }
  if (lastWord) {
    lastWord.lineEnd = true;
  }
  return words;
};

processor.prototype.image = function(node) {
  node.id = 'image';
  if (_.isString(node.image)) {
    if (node.image.indexOf('base64,') === 0) {
      node.image = Buffer.from(node.image.substring(7), 'base64');
    } else {
      node.image = fs.readFileSync(node.image);
    }
  }
  var width = null;
  var height = null;
  // check if buffer is a PNG
  if (Buffer.isBuffer(node.image) && node.image[0] === 0x89 && node.image[1] === 0x50 && node.image[2] === 0x4E && node.image[3] === 0x47) {
    // read PNG dimension directly from IHDR
    width = node.image.readIntBE(16, 4);
    height = node.image.readIntBE(20, 4);
  // check if buffer is a JPG
  } else if (Buffer.isBuffer(node.image) && node.image[0] === 0xff && node.image[1] === 0xd8) {
    var i = 4;
    while (i < node.image.length - 8 && _.isNull(width)) {
      i += node.image.readUInt16BE(i);
      if (node.image[i] !== 255) {
        throw new Error('invalid image jpg format');
      }
      // Search JPG SOF
      if (node.image[i + 1] === 192 || node.image[i + 1] === 193 || node.image[i + 1] === 194) {
        width = node.image.readUInt16BE(i + 7);
        height = node.image.readUInt16BE(i + 5);
      }
      i += 2;
    }
  } else {
    throw new Error('invalid image format');
  }


  if (node.width && node.height) {
    node.width = utils.parseDimension(this.parent.getAvailableWidth(), node.width);
    node.height = utils.parseDimension(this.parent.getAvailableHeight(), node.height);
  } else if (node.width) {
    // get set height ratio
    node.width = utils.parseDimension(this.parent.getAvailableWidth(), node.width);
    node.height = node.width * height / width;
  } else if (node.height) {
    // set node width ratio
    node.height = utils.parseDimension(this.parent.getAvailableHeight(), node.height);
    node.width = node.height * width / height;
  } else {
    // set image width and height
    node.width = width;
    node.height = height;
  }
  node.lineEnd = true;
  return node;
};

module.exports = processor;
