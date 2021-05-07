var _ = require('lodash');
var Page = require('./page');
var defaultStyles = require('./defaultStyles');
var style = require('./style');

var document = function(options, doc) {
  this.id = 'document';
  this.classes = _.cloneDeep(defaultStyles.classes);
  style(this, defaultStyles, this);
  this.size = options.size;
  this.margins = options.margins;
  options.document = this;
  this.currentPage = new Page(options, 1);
  this.pages = [this.currentPage];
  this.pageGroup = [this.pages];
  this.doc = doc;
  this.fonts = {};
  for (var font in options.fonts) {
    var fontDef = options.fonts[font];
    this.registerFont(font, fontDef);
  }
};

document.prototype.registerFont = function(fontName, fontDef) {
  this.fonts[fontName] = {
    normal: fontDef.normal,
    bold: fontDef.bold,
    italics: fontDef.italics,
    bolditalics: fontDef.bolditalics
  };
  if (fontDef.normal) {
    this.doc.registerFont(fontName + '-normal', fontDef.normal);
  }
  if (fontDef.bold) {
    this.doc.registerFont(fontName + '-bold', fontDef.bold);
  }
  if (fontDef.italics) {
    this.doc.registerFont(fontName + '-italics', fontDef.italics);
  }
  if (fontDef.bolditalics) {
    this.doc.registerFont(fontName + '-bolditalics', fontDef.bolditalics);
  }
};

document.prototype.addClass = function(className, style) {
  this.classes[className] = {};
  if (style.font) {
    this.classes[className].font = style.font;
  }
  if (style.fontSize) {
    this.classes[className].fontSize = style.fontSize;
  }
  if (style.lineHeight) {
    this.classes[className].lineHeight = style.lineHeight;
  }
  if (style.bold) {
    this.classes[className].bold = style.bold;
  }
  if (style.italics) {
    this.classes[className].italics = style.italics;
  }
  if (style.characterSpacing) {
    this.classes[className].characterSpacing = style.characterSpacing;
  }
  if (style.color) {
    this.classes[className].color = style.color;
  }
  if (style.decoration) {
    this.classes[className].decoration = style.decoration;
  }
  if (style.markerColor) {
    this.classes[className].markerColor = style.markerColor;
  }
  if (style.alignment) {
    this.classes[className].alignment = style.alignment;
  }
  if (style.fillColor) {
    this.classes[className].fillColor = style.fillColor;
  }
  if (style.columnGap) {
    this.classes[className].columnGap = style.columnGap;
  }
  if (style.margin) {
    this.classes[className].margin = style.margin;
  }
  if (style.padding) {
    this.classes[className].padding = style.padding;
  }
  if (style.border) {
    this.classes[className].border = style.border;
  }
};

document.prototype.setHeader = function(header) {
  this.header = header;
  this.currentPage.setHeader(header);
};

document.prototype.setFooter = function(footer) {
  this.footer = footer;
  this.currentPage.setFooter(footer);
};

document.prototype.resetPageCount = function() {
  this.currentPage.end();
  var options = {
    document: this,
    size: this.size,
    margins: this.margins,
    header: this.header,
    footer: this.footer
  };
  this.currentPage = new Page(options, 1);
  this.pages = [this.currentPage];
  this.pageGroup.push(this.pages);
};

document.prototype.addPage = function() {
  this.currentPage.end();
  var options = {
    document: this,
    size: this.size,
    margins: this.margins,
    header: this.header,
    footer: this.footer
  };
  this.currentPage = new Page(options, this.pages.length + 1);
  this.pages.push(this.currentPage);
};

document.prototype.insert = function(node) {
  var fitOnPage = this.currentPage.insert(node);
  if (!fitOnPage) {
    this.addPage();
    var fitOnNextPage = this.currentPage.insert(node);
    while (!fitOnNextPage && node.container && !node.unbreakable) {
      this.addPage();
      fitOnNextPage = this.currentPage.insert(node);
    }
  }
};

document.prototype.getAvailableWidth = function() {
  return this.currentPage.getAvailableWidth();
};

document.prototype.endOfLine = function() {
  return this.currentPage.endOfLine();
};

document.prototype.getFontName = function(name, bold, italics) {
  var fontVariant = 'normal';
  if (bold && italics) {
    fontVariant = 'bolditalics';
  } else if (bold) {
    fontVariant = 'bold';
  } else if (italics) {
    fontVariant = 'italics';
  }
  return name + '-' + fontVariant;
};

document.prototype.getFont = function(name, bold, italics) {
  var registeredFont = this.getFontName(name, bold, italics);
  return this.doc.font(registeredFont)._font;
};

document.prototype.render = function() {
  var self = this;
  this.currentPage.end();
  this.pageGroup.forEach(function(pages, pageGroupIndex) {
    if (pageGroupIndex) {
      self.doc.addPage();
    }
    self.pages = pages;
    pages.forEach(function(page, i) {
      if (i) {
        self.doc.addPage();
      }
      self._renderPage(page);
    });
  });
  this.doc.end();
  return this.doc;
};

document.prototype._setStyle = function(node) {
  var self = this;
  this.doc.save();
  if (node.translate) {
    this.doc.translate(node.translate.x, node.translate.y);
  }
  var style = node.rect || node.circle || node.line || node.ellipse || node;
  if (style.transform) {
    style.transform.forEach(function(transform) {
      if (transform.scale) {
        self.doc.scale(transform.scale);
      } else if (transform.rotate) {
        self.doc.rotate(transform.rotate.degree, {origin: [transform.rotate.x, transform.rotate.y]});
      }
    });
  }
  if (style.fill) {
    if (style.fill === "none") {
      style.fill = false;
    } else {
      this.doc.fillColor(style.fill);
    }
  }
  if (style['stroke-width']) {
    this.doc.lineWidth(style['stroke-width']);
  }
};

document.prototype._draw = function(node) {
  if (node.text) {
    return this.doc.restore();
  }
  var style = node.rect || node.circle || node.line || node.ellipse || node;
  if (style.fill === "none") {
    style.fill = false;
  }
  if (style.stroke === "none") {
    style.stroke = false;
  }
  if (style.fill) {
    this.doc.fillColor(style.fill);
  }
  if (style.stroke) {
    this.doc.strokeColor(style.stroke);
  }
  if (style.stroke && style.fill) {
    this.doc.fillAndStroke('even-odd');
  } else if (style.fill) {
    this.doc.fill('even-odd');
  } else {
    this.doc.stroke();
  }
  this.doc.restore();
};

document.prototype._renderPage = function(page) {
  var self = this;
  page.container.forEach(function(node) {
    if (_.isString(node.text)) {
      self._setStyle(node);
      self.doc.fillColor(node.color);
      self.doc.font(node.fontName);
      self.doc.fontSize(node.fontSize);

      var currentPage = _.includes(node.text, '{{currentPage}}');
      var pageCount = _.includes(node.text, '{{pageCount}}');
      if ((currentPage || pageCount) && !_.isUndefined(page.currentPage)) {
        if (currentPage) {
          let regex = new RegExp('{{currentPage}}', 'g');
          node.text = node.text.replace(regex, page.currentPage);
        }
        if (pageCount) {
          let regex = new RegExp('{{pageCount}}', 'g');
          node.text = node.text.replace(regex, self.pages.length);
        }

        if (node.alignment === 'right') {
          node.x += node.width - self.doc.widthOfString(node.text);
        }
        if (node.alignment === 'center') {
          node.x += (node.width - self.doc.widthOfString(node.text) / 2);
        }
      }

      self.doc.text(node.text, node.x, node.y, {
        width: self.doc.widthOfString(node.text),
        characterSpacing: node.characterSpacing,
        strike: node.decoration === 'strike',
        underline: node.decoration === 'underline'
      });
      self._draw(node);
    } else if (node.image) {
      self.doc.image(node.image, node.x, node.y, {width: node.width, height: node.height});
    } else if (node.rect) {
      self._setStyle(node);
      self.doc.moveTo(node.x, node.y);
      self.doc.lineTo(node.x + node.rect.width, node.y);
      self.doc.lineTo(node.x + node.rect.width, node.y + node.rect.height);
      self.doc.lineTo(node.x, node.y + node.rect.height);
      self.doc.lineTo(node.x, node.y);
      self._draw(node);
    } else if (node.circle) {
      self._setStyle(node);
      self.doc.circle(node.x, node.y, node.circle.radius);
      self._draw(node);
    } else if (node.ellipse) {
      self._setStyle(node);
      var width_two_thirds = node.ellipse.radius.x * 4 / 3;
      var rotationAngle = 0;
      var dx1 = Math.sin(rotationAngle) * node.ellipse.radius.y;
      var dy1 = Math.cos(rotationAngle) * node.ellipse.radius.y;
      var dx2 = Math.cos(rotationAngle) * width_two_thirds;
      var dy2 = Math.sin(rotationAngle) * width_two_thirds;

      var topCenterX = node.x - dx1;
      var topCenterY = node.y + dy1;
      var topRightX = topCenterX + dx2;
      var topRightY = topCenterY + dy2;
      var topLeftX = topCenterX - dx2;
      var topLeftY = topCenterY - dy2;

      var bottomCenterX = node.x + dx1;
      var bottomCenterY = node.y - dy1;
      var bottomRightX = bottomCenterX + dx2;
      var bottomRightY = bottomCenterY + dy2;
      var bottomLeftX = bottomCenterX - dx2;
      var bottomLeftY = bottomCenterY - dy2;

      self.doc.moveTo(bottomCenterX, bottomCenterY);
      self.doc.bezierCurveTo(bottomRightX, bottomRightY, topRightX, topRightY, topCenterX, topCenterY);
      self.doc.bezierCurveTo(topLeftX, topLeftY, bottomLeftX, bottomLeftY, bottomCenterX, bottomCenterY);

      self._draw(node);
    } else if (node.line) {
      self._setStyle(node);
      self.doc.moveTo(node.x, node.y);
      self.doc.lineTo(node.x + node.line.to.x, node.y + node.line.to.y);
      self._draw(node);
    } else if (node.path) {
      self._setStyle(node);
      self.doc.path(node.path);
      self._draw(node);
    } else if (node.svg) {
      node.svg.forEach(function(elm) {
        elm.translate = {
          x: node.x,
          y: node.y
        };
      });
      self._renderPage({container: node.svg});
    } else {
      /* eslint-disable no-console */
      console.log('not implemented', JSON.stringify(node));
      /* eslint-enable no-console */
    }
  });
};

module.exports = document;