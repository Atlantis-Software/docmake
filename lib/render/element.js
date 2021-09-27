var _ = require('lodash');
var utils = require('./utils');
var attrs = require('./attributes');

var element = function(tag) {
  this.tag = tag;
  this.document = null;
  this.parent = null;
  this.childs = [];
  this.class = [];
  this.content = [];
};

element.prototype.addClass = function(className) {
  this.class.push(className);
};

element.prototype.append = function(child) {
  child.parent = this;
  child.document = this.document;
  this.childs.push(child);
  child.style();
};

element.prototype.style = function() {
  var self = this;
  let elementStyle = {};
  let inline = this.getInlineStyle();
  inline.forEach(function(style) {
    elementStyle[style.property] = {
      value: style.value,
      specificity: style.specificity
    };
  });
  let document = this.getDocumentStyle();
  document.forEach(function(style) {
    if (_.isUndefined(elementStyle[style.property])) {
      return elementStyle[style.property] = {
        value: style.value,
        specificity: style.specificity
      };
    }
    var upper = upperSpecificity(elementStyle[style.property].specificity, style.specificity);
    if (style.specificity === upper) {
      return elementStyle[style.property] = {
        value: style.value,
        specificity: style.specificity
      };
    }
  });
  let inherit = this.getInheritedStyle();
  inherit.forEach(function(style) {
    if (_.isUndefined(elementStyle[style.property])) {
      return elementStyle[style.property] = {
        value: style.value,
        specificity: style.specificity
      };
    }
  });
  // apply style
  _.keys(elementStyle).forEach(function(attrName) {
    self[attrName] = elementStyle[attrName].value;
  });

  attrs.forEach(function(attr) {
    if (_.isUndefined(self[attr.property])) {
      self[attr.property] = attr.default;
    }
  });

  this.border = utils.normalizeSpace(this.border);
  this.borders = {
    left: this.border[0],
    top: this.border[1],
    right: this.border[2],
    bottom: this.border[3]
  };

  this.margin = utils.normalizeSpace(this.margin);
  this.margins = {
    left: this.margin[0],
    top: this.margin[1],
    right: this.margin[2],
    bottom: this.margin[3]
  };
};

var upperSpecificity = function(a , b, level) {
  level = level || 0;
  if (a[level] > b[level]) {
    return a;
  }
  if (b[level] > a[level]) {
    return b;
  }
  level++;
  if (level > 4) {
    return b;
  }
  return upperSpecificity(a, b, level);
};

element.prototype.getInlineStyle = function() {
  var self = this;
  var inlineStyle = [];
  // inline specificity
  let specificity = [0, 1, 0, 0, 0];
  attrs.forEach(function(attr) {
    let validate = utils.validate(attr.type);
    if (validate(self[attr.property])) {
      inlineStyle.push({property: attr.property, specificity, value: self[attr.property]});
    }
  });
  return inlineStyle;
};

element.prototype.getDocumentStyle = function() {
  return this.document.css.matchAttributes(this);
};

element.prototype.getInheritedStyle = function() {
  var self = this;
  var inheritedStyle = [];
  attrs.forEach(function(attr) {
    if (attr.inherit && self.parent && self.parent[attr.property]) {
      inheritedStyle.push({property: attr.property, specificity: [0, 0, 0, 0, 0], value: self.parent[attr.property]});
    }
  });
  return inheritedStyle;
};

element.prototype.clone = function() {
  var self = this;
  var clone = new element(this.tag);
  attrs.forEach(function(attr) {
    clone[attr.property] = self[attr.property];
  });
  clone.document = this.document;
  clone.parent = this.parent;
  clone.class = _.clone(this.class);
  clone.fontName = this.fontName;
  clone.margins = _.clone(this.margins);
  clone.borders = _.clone(this.borders);
  if (_.isArray(this.content)) {
    clone.content = [];
    this.content.forEach(function(cnt) {
      if (_.isFunction(cnt.clone)) {
        clone.content.push(cnt.clone());
      } else {
        clone.content.push(_.clone(cnt));
      }
    });
  } else {
    clone.content = _.clone(this.content);
  }
  return clone;
};

module.exports = element;
