var tokenizer = require('./tokenizer');
var parser = require('./parser');
var emitter = require('./emitter');
var helpers = require('./helpers/helpers');

var compiler = function() {
  this.tokenizer = new tokenizer();
  this.parser = new parser();
  this.emitter = new emitter();
  helpers(this);
};

compiler.prototype.compile = function(input, data, cb) {
  try {
    var tokens = this.tokenizer.tokenize(input);
    var ast    = this.parser.parseProgram(tokens);
  } catch (err) {
    return cb(err);
  }
  this.emitter.setRoot(data);
  this.emitter.emit(ast, data).done(function(res) {
    cb(null, res);
  }).fail(cb);
};

compiler.prototype.registerHelper = function(name, handler) {
  this.parser.tagNames.push(name);
  return this.emitter.registerHelper(name, handler);
};

module.exports = compiler;
