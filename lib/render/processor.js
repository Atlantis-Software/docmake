var fs = require('fs');
var _ = require('lodash');
var LineBreaker = require('linebreak');
var stack = require('./elements/stack');
var svg = require('./elements/svg');
var table = require('./elements/table');
var columns = require('./elements/columns');
var utils = require('./utils');
var Container = require('./container');
var Element = require('./element');
var attrs = require('./attributes');

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
    if (_.isUndefined(node) || _.isNull(node)) {
      return;
    }
    if (_.isString(node)) {
      let textNode = new Element('text');
      textNode.content = node;
      node = textNode;
    } else if (_.isNumber(node)) {
      let textNode = new Element('text');
      textNode.content = node.toString();
      node = textNode;
    }
    // node without style
    if (node.tag === "resetPageCount") {
      self.document.resetPageCount();
    } else if (node.tag === "pageBreak") {
      self.document.addPage();
    } else if (node.tag === "closeDoc") {
      self.document.closeDoc();
    } else if (node.tag === "font") {
      self.document.registerFont(node.content, node);
    } else if (node.tag === "class") {
      let selectors = [{
        tag: null,
        classes:[node.content],
        id: null,
        attrs:[],
        // specificity array indexes:
        // 0: id
        // 1: class & attribute
        // 2: element
        specificity: [0, 1, 0]
      }];
      let declarations = [];
      attrs.forEach(function(attr) {
        if (node[attr.property]) {
          declarations.push({
            property: attr.property,
            specificity: [0, 0],
            value: node[attr.property]
          });
        }
      });
      self.document.css.rules.push({
        selectors,
        declarations
      });
    } else if (node.tag === "style") {
      self.document.css.parse(node.content);
    } else {
      self.parentStyle.append(node);
      node.elementId = elementId++;
      // process node
      nodes = [];
      if (node.tag === "text") {
        nodes = self.text(node);
      } else if (node.tag === "image") {
        nodes = [self.image(node)];
      } else if (node.tag === "columns") {
        nodes = [columns(processor, self.document, self.parent, node)];
      } else if (node.tag === "table") {
        nodes = [table(processor, self.document, self.parent, node)];
      } else if (node.tag === "svg") {
        nodes = [svg(self.document, self.parent, node)];
      } else if (node.tag === "pageHeader") {
        self.document.setHeader(node);
      } else if (node.tag === "pageFooter") {
        self.document.setFooter(node);
      } else if (node.tag === "stack") {
        nodes = [stack(processor, self.document, self.parent, node)];
      } else if (node.tag === "hspace" || node.tag === "vspace") {
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
  node.id = node.id || 'text';
  if (!_.isString(node.content)) {
    return [];
  }
  var maxWidth = utils.parseDimension(this.parent.getAvailableWidth(), node.width);
  var textContainer = new Container(node, [maxWidth, node.height || Infinity]);
  node.content = node.content.replace(/\\n/gi, "\n");
  var breaker = new LineBreaker(node.content);
  var bk = null;
  var last = 0;
  var lastWord;

  var fontFeatures = null;
  var font = this.document.getFont(node.font, node.bold, node.italics);
  var textHeight = font.lineHeight(node.fontSize) * node.lineHeight;
  var fontName =  this.document.getFontName(node.font, node.bold, node.italics);

  if (node.content === '') {
    node.width = 0;
    node.height = textHeight;
    node.fontName = fontName;
    node.textId =  node.elementId;
    node.lineEnd = true;
    return [node];
  }

  while ((bk = breaker.nextBreak())) {
    /*let word = new Element('text');
    // clone attributes
    attrs.forEach(function(attr) {
      word[attr.property] = node[attr.property];
    });
    word.document = node.document;
    word.parent = node.parent;*/
    let word = node.clone();
    // TODO
    word.borders = node.borders;
    word.margins = node.margins;

    word.content = node.content.slice(last, bk.position);
    if (word.content.endsWith('\n')) {
      word.content = word.content.slice(0,-1);
      word.lineEnd = true;
    }
    word.textId =  node.elementId;
    word.fontName = fontName;
    word.width = font.widthOfString(word.content, node.fontSize, fontFeatures) + ((node.characterSpacing || 0) * (word.content.length - 1));
    word.height = textHeight;
    // split word if not feet in width
    if (word.width > maxWidth) {
      for (var i = 0; i < word.content.length; i++) {
        if ((word.content[i] === '\r' || word.content[i] === '\n') && lastWord) {
          lastWord.lineEnd = true;
          continue;
        }
        /*let char = new Element('text');
        // clone attributes
        attrs.forEach(function(attr) {
          char[attr.property] = node[attr.property];
        });
        char.document = node.document;
        char.parent = node.parent;*/
        let char = node.clone();

        char.content = word.content[i];
        char.textId =  node.elementId;
        char.fontName = fontName;
        char.width = font.widthOfString(char.content, node.fontSize, fontFeatures);
        char.height = textHeight;
        char.id = 'char' + i;
        textContainer.insert(char);
        lastWord = char;
      }
      if (bk.required && lastWord) {
        lastWord.lineEnd = true;
      }
    } else {
      if (bk.required || word.content.match(/\r?\n$|\r$/)) { // new line
        word.content = word.content.replace(/\r?\n$|\r$/, '');
        word.lineEnd = true;
      }
      word.id = 'word' + bk.position;
      textContainer.insert(word);
    }
    last = bk.position;
  }
  if (!node.height) {
    textContainer.setHeight(textContainer.getMinHeight());
  }
  if (!node.width) {
    textContainer.setWidth(textContainer.getMinWidth());
  }
  textContainer.lineEnd = true;
  return [textContainer];
};

processor.prototype.image = function(node) {
  node.id = node.id || 'image';
  if (_.isString(node.content)) {
    if (node.content.indexOf('base64,') === 0) {
      node.content = Buffer.from(node.content.substring(7), 'base64');
    } else {
      node.content = fs.readFileSync(node.content);
    }
  }
  var width = null;
  var height = null;
  // check if buffer is a PNG
  if (Buffer.isBuffer(node.content) && node.content[0] === 0x89 && node.content[1] === 0x50 && node.content[2] === 0x4E && node.content[3] === 0x47) {
    // read PNG dimension directly from IHDR
    width = node.content.readIntBE(16, 4);
    height = node.content.readIntBE(20, 4);
  // check if buffer is a JPG
  } else if (Buffer.isBuffer(node.content) && node.content[0] === 0xff && node.content[1] === 0xd8) {
    var i = 4;
    while (i < node.content.length - 8 && _.isNull(width)) {
      i += node.content.readUInt16BE(i);
      if (node.content[i] !== 255) {
        throw new Error('invalid image jpg format');
      }
      // Search JPG SOF
      if (node.content[i + 1] === 192 || node.content[i + 1] === 193 || node.content[i + 1] === 194) {
        width = node.content.readUInt16BE(i + 7);
        height = node.content.readUInt16BE(i + 5);
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
