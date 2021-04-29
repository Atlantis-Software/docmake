module.exports = function(compiler) {
  compiler.registerHelper('if', function(condition, options) {
    if (arguments.length !== 2) {
      throw new Error('if require only one argument');
    }
    if (condition) {
      return options.fn(this);
    }
  });
};
