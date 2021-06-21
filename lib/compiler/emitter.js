var asynk = require('asynk');
var _ = require('lodash');
var mathjs = require('mathjs');
var Block = require('./block');
var Element = require('./element');

var math = mathjs.create({ evaluateDependencies: mathjs.evaluateDependencies });

math.config({
  matrix: 'Array',
  number: 'number'
});

math.import({
  add: function(a, b) {
    return a + b;
  },
  substract: function(a, b) {
    return a - b;
  },
  multiply: function(a, b) {
    return a * b;
  },
  divide: function(a, b) {
    return a / b;
  },
  equal: function(a, b) {
    return a == b;
  },
  unequal: function(a, b) {
    return a != b;
  },
  and: function(a, b) {
    return a && b;
  },
  or: function(a, b) {
    return a || b;
  },
  not: function(a) {
    return !a;
  },
  larger: function(a, b) {
    return a > b;
  },
  largereq: function(a, b) {
    return a >= b;
  },
  smaller: function(a, b) {
    return a < b;
  },
  smallereq: function(a, b) {
    return a <= b;
  },
  concat: function() {
    var res = null;
    var args = Array.prototype.slice.call(arguments);
    args.forEach(function(arg) {
      if (_.isNumber(arg)) {
        arg = arg.toString();
      }
      if (_.isString(arg)) {
        if (_.isNull(res)) {
          res = arg;
        } else {
          res += arg;
        }
      }
    });
    return res;
  },
  sizeOf: function(arg) {
    if (_.isArray(arg) || _.isString(arg)) {
      return arg.length;
    }
    if (_.isObject) {
      return _.keys(arg).length;
    }
    return null;
  },
}, {override: true});

var emitter = function() {
  this.helpers = {};
};

emitter.prototype.emitNumber = function(node) {
  var end = asynk.deferred();
  if (node && node.value) {
    end.resolve(node.value);
  } else {
    var err = new Error('Invalide Number');
    err.position = node.position;
    end.reject(err);
  }
  return end.promise();
};

emitter.prototype.emitString = function(node) {
  var end = asynk.deferred();
  if (node && _.isString(node.value)) {
    end.resolve(`${node.value}`);
  } else {
    var err = new Error('Invalide String');
    err.position = node.position;
    end.reject(err);
  }
  return end.promise();
};

emitter.prototype.emitName = function(node, context) {
  var end = asynk.deferred();
  if (node && node.value) {
    if (_.has(context, node.value)) {
      end.resolve(_.get(context, node.value));
    } else {
      end.resolve("");
    }
  } else {
    end.reject(new Error('Invalide Name'));
  }
  return end.promise();
};

emitter.prototype.emitBoolean = function(node) {
  var end = asynk.deferred();
  if (node && node.value === 'true') {
    end.resolve(true);
  } else if (node && node.value === 'false') {
    end.resolve(false);
  } else {
    var err = new Error('invalid boolean value');
    err.position = node.position;
    end.reject(err);
  }
  return end.promise();
};

emitter.prototype.emitProgram = function(node, context) {
  var end = asynk.deferred();
  var self = this;

  var actions = [];
  node.body.forEach(function(node) {
    actions.push(self.emit(node, context));
  });
  var contents = [];
  asynk.when.apply(asynk, actions).done(function() {
    asynk.each(actions, function(action, cb) {
      action.done(function(item) {
        if (action instanceof Block) {
          contents = Array.prototype.concat(contents, item);
        } else {
          contents.push(item);
        }
        cb();
      });
    }).serie().asCallback(function(err) {
      if (err) {
        return end.reject(err);
      }
      end.resolve(contents);
    });

  }).fail(function(err) {
    end.reject(err);
  });
  return end.promise();
};

emitter.prototype.emitFunction = function(node, context) {
  var expression = {
    type: 'Expression',
    value: [{
      type: 'Function',
      value: node.value
    }],
    position: node.position
  };
  return this.emitExpression(expression, context);
};

emitter.prototype.emitArray = function(node, context) {
  var expression = {
    type: 'Expression',
    value: [{
      type: 'Array',
      value: node.value
    }],
    position: node.position
  };
  return this.emitExpression(expression, context);
};

emitter.prototype.emitExpression = function(node, context) {
  var end = asynk.deferred();
  var exp = [];
  var err = null;
  if (!_.isArray(node.value)) {
    err = new Error('Invalid Node Expression:\n' + JSON.stringify(node));
    err.position = node.position;
    return end.reject(err);
  }
  node.value.forEach(function(element) {
    if (err) {
      return;
    }
    if (!element || !element.type || !_.isString(element.value)) {
      err = new Error('Invalid element in Expression:\n' + JSON.stringify(element));
      return;
    }
    if (element.type === 'String') {
      return exp.push('"' + element.value + '"');
    }
    exp.push(element.value);
  });
  if (err) {
    err.position = node.position;
    end.reject(err);
    return end.promise();
  }
  exp = exp.join(' ');
  try {
    /* TODO precompile expression in parser
    exp = math.parse(exp);
    exp = exp.compile();
    exp = exp.evaluate(context);
    */
    exp = math.evaluate(exp, context);
  } catch (err) {
    err.message += ' in Expression:\n' + exp;
    err.position = node.position;
    end.reject(err);
    return end.promise();
  }
  end.resolve(exp);
  return end.promise();
};

emitter.prototype.emitBlock = function(node, context) {
  var block = new Block(this, node, context);
  return block.emit();
};

emitter.prototype.emitElement = function(node, context) {
  var element = new Element(this, node, context);
  return element.emit();
};

emitter.prototype.emit = function(node, context) {
  switch (node.type) {
    case 'Program':          return this.emitProgram(node, context);
    case 'Name':             return this.emitName(node, context);
    case 'Function':         return this.emitFunction(node, context);
    case 'Array':            return this.emitArray(node, context);
    case 'Expression':       return this.emitExpression(node, context);
    case 'Block':            return this.emitBlock(node, context);
    case 'Element':          return this.emitElement(node, context);
    case 'Number':           return this.emitNumber(node, context);
    case 'String':           return this.emitString(node, context);
    case 'Boolean':          return this.emitBoolean(node, context);
    default:
      var err = new TypeError(node.type);
      err.position = node.position;
      throw err;
  }
};

emitter.prototype.registerHelper = function(name, handler) {
  if (this.helpers[name]) {
    throw new Error('Helper ' + name + ' already registered !');
  }
  this.helpers[name] = handler;
};

emitter.prototype.setRoot = function(root) {
  this.root = root;
};

module.exports = emitter;




