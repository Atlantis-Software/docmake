var _ = require('lodash');

var parser = function() {
  this.tagNames = [];
};

parser.prototype.parseNumber = function(tokens, current) {
  return [current + 1, {
    type: 'Number',
    value: tokens[current].value
  }];
};

parser.prototype.parseString = function(tokens, current) {
  return [current + 1, {
    type: 'String',
    value: tokens[current].value
  }];
};

parser.prototype.parseName = function(tokens, current) {
  return [current + 1, {
    type: 'Name',
    value: tokens[current].value
  }];
};

parser.prototype.parseOperator = function(tokens, current) {
  return [current + 1, {
    type: 'Operator',
    value: tokens[current].value
  }];
};

parser.prototype.parseBoolean = function(tokens, current) {
  return [current + 1, {
    type: 'Boolean',
    value: tokens[current].value
  }];
};

parser.prototype.isExpValue = function(token) {
  switch (token.type) {
    case 'name':
    case 'number':
    case 'string':
    case 'boolean':
      return true;
    default:
      return false;
  }
};

parser.prototype.parseExpression = function(tokens, current) {
  var self = this;
  let token = tokens[current];
  var parseExpToken = function(token) {
    switch (token.type) {
      case 'name': [, token] = self.parseName([token], 0); break;
      case 'number': [, token] = self.parseNumber([token], 0); break;
      case 'string': [, token] = self.parseString([token], 0); break;
      case 'boolean': [, token] = self.parseBoolean([token], 0); break;
      case 'operator': [, token] = self.parseOperator([token], 0); break;
      default: throw new Error('Invalid expression ' + token.type + ' ' + token.value);
    }
    return token;
  };
  var last = this.isExpValue(token);
  var same = true;
  var exp = [parseExpToken(token)];
  while (same && current < tokens.length) {
    let token = tokens[++current];
    let value = this.isExpValue(token);
    if (last === value && value === true || !value && token.type !== 'operator') {
      same = false;
      continue;
    }
    last = value;
    exp.push(parseExpToken(token));
  }
  return [current, {
    type: 'Expression',
    value: exp
  }];
};

parser.prototype.parseTag = function(tokens, current) {
  let token = tokens[++current];
  let node = {
    type: 'Element',
    name: '',
    params: [],
    hash: {}
  };

  if (token.value === '#' || token.value === '/') {
    node.type = 'Block';
    node.block = token.value;
    token = tokens[++current];
  }

  node.name = token.value;

  token = tokens[++current];
  var params = [];
  while (token && !(token.type === 'paren' && token.value ==='}}')) {
    var param = null;
    [current, param] = this.parseToken(tokens, current);
    params.push(param);
    token = tokens[current];
  }

  params.forEach(function(param) {
    if (param.type !== 'Expression') {
      node.params.push(param);
      return;
    }
    if (param.value[0].type === 'Name' && param.value[1].value === '=') {
      let name = param.value[0].value;
      param.value = param.value.slice(2);
      node.hash[name] = param;
      return;
    }
    node.params.push(param);
  });

  current++;
  if (node.block === "#") {
    node.contents = [];
    token = tokens[current];
    let content = {};
    while (token && !(content.block === '/' && content.name === node.name)) {
      [current, content] = this.parseToken(tokens, current);
      if (content.block !== '/') {
        node.contents.push(content);
      }
      token = tokens[current];
    }
  } else if (node.block === '/') {
    // do nothing
  } else if ((node.params.length === 0) && !_.includes(this.tagNames, node.name)) {
    node = {
      type: 'Expression',
      value: [{
        type: 'Name',
        value: node.name
      }]
    };
  }
  return [current, node];
};

parser.prototype.parseToken = function(tokens, current) {
  let token = tokens[current];
  let next = tokens[current + 1];

  if (token.type === 'operator' || this.isExpValue(token) && next && next.type === 'operator') {
    return this.parseExpression(tokens, current);
  }
  if (token.type === 'number') {
    return this.parseNumber(tokens, current);
  }
  if (token.type === 'string') {
    return this.parseString(tokens, current);
  }
  if (token.type === 'name') {
    return this.parseName(tokens, current);
  }
  if (token.type === 'paren' && token.value === '{{') {
    return this.parseTag(tokens, current);
  }
  if (token.type === 'boolean') {
    return this.parseBoolean(tokens, current);
  }
  throw new TypeError(token.type);
};

parser.prototype.parseProgram = function(tokens) {
  let current = 0;
  let ast = {
    type: 'Program',
    body: [],
  };
  let node = null;
  while (current < tokens.length) {
    [current, node] = this.parseToken(tokens, current);
    ast.body.push(node);
  }
  return ast;
};

module.exports = parser;
