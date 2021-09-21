var css = require('css');
var mathjs = require('mathjs');

var math = mathjs.create({ evaluateDependencies: mathjs.evaluateDependencies });

math.config({
  matrix: 'Array',
  number: 'number'
});

var cssParser = function() {
  this.rules = [];
};

cssParser.prototype.parse = function(rawCss) {
  var self = this;
  let stylesheet = css.parse(rawCss).stylesheet;
  stylesheet.rules.forEach(function(rule) {
    let selectors = self.parseSelector(rule.selectors);
    let declarations = [];
    rule.declarations.forEach(function(decl) {
      let parsedValue = self.parseValue(decl.value);
      let declaration = {
        property: decl.property,
        specificity: parsedValue.specificity,
        value: parsedValue.value
      };
      declarations.push(declaration);
    });
    self.rules.push({
      selectors,
      declarations
    });
  });
  return self.rules;
};

cssParser.prototype.parseSelector = function(selectors) {
  var selects = [];
  selectors.forEach(function(selector) {
    var select = {
      tag: null,
      classes:[],
      id: null,
      attrs:[],
      // specificity array indexes:
      // 0: id
      // 1: class & attribute
      // 2: element
      specificity: [0, 0, 0]
    };
    selector.split(/(?=\.)|(?=#)|(?=\[)/).forEach(function(token){
      switch (token[0]) {
        case '#':
          select.specificity[0] = 1;
          select.id = token.slice(1);
          break;
        case '.':
          select.specificity[1]++;
          select.classes.push(token.slice(1));
          break;
        case '[':
          select.specificity[1]++;
          select.attrs.push(token.slice(1,-1).split('='));
          break;
        default :
          select.specificity[2] = 1;
          select.tag = token;
          break;
      }
    });
    selects.push(select);
  });
  return selects;
};

cssParser.prototype.parseValue = function(value) {
  let tokens = value.split(/(?=!important)/);
  let val = tokens[0].trim();
  if (!val.startsWith('#')) {
    try {
      val = math.evaluate(val, {});
    } catch (e) {
      throw new Error('invalid css value ' + tokens[0].trim());
    }
  }

  return {
    // specificity array indexes:
    // 0: !important
    // 1: inline
    specificity: [tokens.length - 1, 0],
    value: val
  };
};

cssParser.prototype.matchAttributes = function(node) {
  var self = this;
  var attrs = [];
  this.rules.forEach(function(rule) {
    rule.selectors.forEach(function(selector) {
      if (self.matchSelector(selector, node)) {
        rule.declarations.forEach(function(declaration) {
          attrs.push({
            property: declaration.property,
            specificity: [].concat(declaration.specificity, selector.specificity),
            value: declaration.value
          });
        });
      }
    });
  });
  return attrs;
};

cssParser.prototype.matchSelector = function(selector, node) {
  var match = true;
  // check id
  if (selector.id) {
    match = selector.id === node.id;
    if (!match) {
      return false;
    }
  }
  // check tags
  if (selector.tag && selector.tag !== "*") { // universal selector
    match = node.tag === selector.tag;
    if (!match) {
      return false;
    }
  }
  // check classes
  if (selector.classes.length) {
    selector.classes.forEach(function(className) {
      if (!node.class.includes(className)) {
        match = false;
      }
    });
    if (!match) {
      return false;
    }
  }
  // check attributes
  if (selector.attrs.length) {
    selector.attrs.forEach(function(attr) {
      let name = attr[0];
      let val = attr[1];
      if (!node[name] || node[name] !== val) {
        match = false;
      }
    });
  }

  return match;
};

module.exports = cssParser;
