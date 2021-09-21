var XMLParser = require('../XMLParser');
var _ = require('lodash');
var Element = require('../element');
var utils = require('../utils');

var Colors = require('./svgColors');

var getColor = function(color) {
  if (color === 'none') {
    return color;
  }
  if (color.startsWith('#')) {
    return color;
  }
  if (Colors[color]) {
    return Colors[color];
  }
  return Colors['white'];
};

module.exports = function(document, parent, node) {
  var svg = null;
  try {
    svg = XMLParser(node.content[0]);
  } catch (err) {
    throw new Error('Invalid SVG: ' + err);
  }
  if (svg.name !== "svg") {
    throw new Error('SVG: expected <svg> document');
  }

  var stripUnits = function(textVal) {
    var n = parseFloat(textVal);
    if (!_.isNumber(n) || _.isNaN(n)) {
      return undefined;
    }
    return n;
  };

  var width = stripUnits(svg.attr.width);
  var height = stripUnits(svg.attr.height);
  var offsetX = 0;
  var offsetY = 0;

  if (_.isString(svg.attr.viewBox)) {
    var viewBoxParts = svg.attr.viewBox.split(/[,\s]+/);
    if (viewBoxParts.length !== 4) {
      throw new Error("Unexpected svg viewbox format, should have 4 entries but found: '" + svg.attr.viewBox + "'");
    }

    if (_.isUndefined(width)) {
      width = stripUnits(viewBoxParts[2]);
    }
    if (_.isUndefined(height)) {
      height = stripUnits(viewBoxParts[3]);
    }
    var x = stripUnits(viewBoxParts[0]);
    var y = stripUnits(viewBoxParts[1]);
    if (x !== 0) {
      offsetX = 0 - x;
    }
    if (y !== 0) {
      offsetY = 0 - y;
    }
  }

  if (node.width && node.height) {
    throw new Error("SVG can't have a defined width and height");
  } else if (node.width) {
    // get set height ratio
    node.width = utils.parseDimension(parent.getAvailableWidth(), node.width);
    node.height = node.width * height / width;
  } else if (node.height) {
    // set node width ratio
    node.height = utils.parseDimension(parent.getAvailableHeight(), node.height);
    node.width = node.height * width / height;
  } else {
    // set image width and height
    node.width = width;
    node.height = height;
  }
  // set ratio for defined size
  var scale = node.width / width;

  node.content = [];
  var SVGstyle = function(element, defaultStyle) {
    // parse transformations
    function parseTransformation(transformString) {
      var transformations = [];
      if (scale !== 1) {
        transformations.push({
          scale: scale
        });
      }
      if (transformString) {
        /* eslint-disable no-useless-escape */
        for (var i in transformString = transformString.match(/(\w+\((\-?\d+\.?\d*e?\-?\d*(,|\s)?)+\))+/g)) {
          /* eslint-enable no-useless-escape */
          var transformObj={};
          /* eslint-disable no-useless-escape */
          var transformFunction = transformString[i].match(/[\w\.\-]+/g);
          /* eslint-enable no-useless-escape */
          var transformFunctionName = transformFunction.shift();
          switch (transformFunctionName) {
            case 'rotate':
              transformObj.rotate = {
                degree: transformFunction[0] || 0,
                x: transformFunction[1] ? parseFloat(transformFunction[1]) + offsetX : offsetX,
                y: transformFunction[2] ? parseFloat(transformFunction[2]) + offsetY : offsetY
              };
              break;
            case 'translate':
              transformObj.translate = {
                x: transformFunction[0] ? parseFloat(transformFunction[0]) + offsetX : offsetX,
                y: transformFunction[1] ? parseFloat(transformFunction[1]) + offsetY : offsetY
              };
              break;
          }
          transformations.push(transformObj);
        }
      }
      return transformations;
    }

    if (element.attr.style) {
      var styles = element.attr.style.split(';');
      styles.forEach(function(style) {
        var attrVal = style.split(':');
        var attrName = attrVal[0];
        var value = attrVal[1];
        if (attrName && value) {
          element.attr[attrName.trim()] = value.trim();
        }
      });
    }

    var transform = parseTransformation(element.attr.transform);
    return {
      fill: element.attr.fill ? getColor(element.attr.fill) : defaultStyle.fill,
      stroke: element.attr.stroke ? getColor(element.attr.stroke) : defaultStyle.stroke,
      'stroke-width': element.attr['stroke-width'] ? parseFloat(element.attr['stroke-width']) : defaultStyle['stroke-width'],
      transform: transform
    };
  };
  var parse = function(element, defaultStyle) {
    var elm = new Element(element.name);
    switch (element.name) {
      case 'g':
        var gStyle = SVGstyle(element, defaultStyle);
        element.children.forEach(function(child) {
          parse(child, gStyle);
        });
        break;
      case 'rect':
        elm.content = SVGstyle(element, defaultStyle);
        elm.content.width = element.attr.width ? parseFloat(element.attr.width) : 0;
        elm.content.height = element.attr.height ? parseFloat(element.attr.height) : 0;
        elm.x = element.attr.x ? parseFloat(element.attr.x) + offsetX : offsetX;
        elm.y = element.attr.y ? parseFloat(element.attr.y) + offsetY : offsetY;
        node.content.push(elm);
        break;
      case 'circle':
        elm.content = SVGstyle(element, defaultStyle);
        elm.content.radius = element.attr.r ? parseFloat(element.attr.r) : 0;
        elm.x = element.attr.cx ? parseFloat(element.attr.cx) + offsetX : offsetX;
        elm.y = element.attr.cy ? parseFloat(element.attr.cy) + offsetY : offsetY;
        node.content.push(elm);
        break;
      case 'ellipse':
        elm.content = SVGstyle(element, defaultStyle);
        elm.content.radius = {
          x: element.attr.rx ? parseFloat(element.attr.rx) : 0,
          y: element.attr.ry ? parseFloat(element.attr.ry) : 0
        };
        elm.x = element.attr.cx ? parseFloat(element.attr.cx) + offsetX: offsetX;
        elm.y = element.attr.cy ? parseFloat(element.attr.cy) + offsetY: offsetY;
        node.content.push(elm);
        break;
      case 'line':
        var x1 = element.attr.x1 ? parseFloat(element.attr.x1) : 0;
        var y1 = element.attr.y1 ? parseFloat(element.attr.y1) : 0;
        var x2 = element.attr.x2 ? parseFloat(element.attr.x2) : 0;
        var y2 = element.attr.y2 ? parseFloat(element.attr.y2) : 0;
        elm.content = SVGstyle(element, defaultStyle);
        elm.content.to = {
          x: x2 - x1,
          y: y2 - y1
        };
        elm.x = x1 + offsetX;
        elm.y = y1 + offsetY;
        node.content.push(elm);
        break;
      case 'text':
        elm = SVGstyle(element, defaultStyle);
        node.append(elm);
        elm.fontName = document.getFontName(elm.font, elm.bold, elm.italics);
        elm.content = element.val;
        var fontFeatures = null;
        var font = document.getFont(elm.font, elm.bold, elm.italics);
        elm.width = font.widthOfString(elm.text, elm.fontSize, fontFeatures) + ((elm.characterSpacing || 0) * (elm.text.length - 1));
        elm.x = element.attr.x ? parseFloat(element.attr.x) + offsetX : offsetX;
        elm.y = element.attr.y ? parseFloat(element.attr.y) + offsetY : offsetY;
        node.content.push(elm);
        break;
      case 'path':
        elm = SVGstyle(element, defaultStyle);
        elm.content = element.attr.d;
        elm.x = offsetX;
        elm.y = offsetY;
        node.content.push(elm);
        break;
    }
  };
  var root = {
    fill: svg.attr.fill ? getColor(svg.attr.fill) : '#000000',
    stroke: svg.attr.stroke ? getColor(svg.attr.stroke) : 'none',
    'stroke-width': svg.attr['stroke-width'] ? parseFloat(svg.attr['stroke-width']) : 1
  };
  svg.children.forEach(function(element) {
    parse(element, root);
  });
  node.lineEnd = true;
  return node;
};
