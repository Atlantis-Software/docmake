var _ = require('lodash');
var defaultStyles = require('./defaultStyles');

var normalizeSpace = function(space) {
  if (_.isNumber(space)) {
    return [space, space, space, space];
  }
  if (_.isArray(space)) {
    if (space.length === 2) {
      return [space[0], space[1], space[0], space[1]];
    }
    if (space.length === 4) {
      return space;
    }
  }
  throw new Error('Invalid space');
};

var validateSpace = function(space) {
  if (_.isNumber(space)) {
    return true;
  }
  if (_.isArray(space)) {
    if (space.length === 2 && _.isNumber(space[0]) && _.isNumber(space[1])) {
      return true;
    }
    if (space.length === 4 && _.isNumber(space[0]) && _.isNumber(space[1]) && _.isNumber(space[2]) && _.isNumber(space[3])) {
      return true;
    }
  }
  return false;
};

var expandSpace = function(space) {
  space = normalizeSpace(space);
  return {
    left: space[0],
    top: space[1],
    right: space[2],
    bottom: space[3]
  };
};

var computeInlineStyle = function(node) {
  var inline = {};
  inline.font = _.isString(node.font) ? node.font : null;
  inline.fontSize = _.isNumber(node.fontSize) ? node.fontSize : null;
  inline.lineHeight = _.isNumber(node.lineHeight) ? node.lineHeight : null;
  inline.bold = _.isBoolean(node.bold) ? node.bold : null;
  inline.italics = _.isBoolean(node.italics) ? node.italics : null;
  inline.characterSpacing = _.isNumber(node.characterSpacing) ? node.characterSpacing : null;
  inline.color = _.isString(node.color) ? node.color : null;
  inline.decoration = ['none', 'underline', 'strike'].includes(node.decoration) ? node.decoration : null;
  inline.markerColor = _.isString(node.markerColor) ? node.markerColor : null;
  inline.alignment = ['left', 'center', 'right'].includes(node.alignment) ? node.alignment : null;
  inline.valignment = ['top', 'center', 'bottom'].includes(node.valignment) ? node.valignment : null;
  inline.fillColor = _.isString(node.fillColor) ? node.fillColor : null;
  inline.columnGap = _.isNumber(node.columnGap) ? node.columnGap : null;
  inline.margin = validateSpace(node.margin) ? node.margin : null;
  inline.border = validateSpace(node.border) ? node.border : null;
  return inline;
};

var computeClassesStyle = function(document, classes) {
  var classesStyle = {
    font: null,
    fontSize: null,
    lineHeight: null,
    bold: null,
    italics: null,
    characterSpacing: null,
    color: null,
    decoration: null,
    markerColor: null,
    alignment: null,
    valignment: null,
    fillColor: null,
    columnGap: null,
    margin: null,
    border: null
  };

  classes.forEach(function(className) {
    _.keys(document.classes[className]).forEach(function(attrName) {
      classesStyle[attrName] = _.clone(document.classes[className][attrName]);
    });
  });
  return classesStyle;
};

var computeInheritanceStyle = function(parent) {
  return {
    font: parent.font,
    fontSize: parent.fontSize,
    lineHeight: parent.lineHeight,
    bold: parent.bold,
    italics: parent.italics,
    characterSpacing: parent.characterSpacing,
    color: parent.color,
    decoration: parent.decoration,
    markerColor: parent.markerColor,
    alignment: parent.alignment,
    valignment: parent.valignment,
    // this attribute doesn't herit so take defaults
    fillColor: defaultStyles.fillColor,
    columnGap: defaultStyles.columnGap,
    margin: defaultStyles.margin,
    border: defaultStyles.border
  };
};

var mergeStyle = function(dest, src) {
  var merge = _.clone(dest);
  _.keys(src).forEach(function(attr) {
    if (!_.isNull(src[attr])) {
      merge[attr] = src[attr];
    }
  });
  return merge;
};

module.exports = function(document, parent, node) {
  var inline = computeInlineStyle(node);
  var classes = computeClassesStyle(document, node.class || []);
  var inherited = computeInheritanceStyle(parent);

  var style = mergeStyle(inherited, classes);
  style = mergeStyle(style, inline);
  // apply style to node
  _.keys(style).forEach(function(attrName) {
    node[attrName] = style[attrName];
  });

  node.margins = expandSpace(node.margin);
  node.borders = expandSpace(node.border);
};