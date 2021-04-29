var _ = require('lodash');

module.exports = function(compiler) {
  compiler.registerHelper('each', function(iteratable, options) {
    if (arguments.length !== 2) {
      throw new Error('each require only one argument');
    }
    if (!_.isArray(iteratable) && !_.isObject(iteratable)) {
      throw new Error('each require an array or an object as argument');
    }
    iteratable = _.cloneDeep(iteratable);
    if (_.isArray(iteratable)) {
      iteratable.forEach(function(item, i) {
        item['@root'] = options.root;
        item['@index'] = i;
        item['@first'] = i === 0;
        item['@last'] = i === (iteratable.length -1);
        options.fn(item);
      });
    } else {
      var keys = _.keys(iteratable);
      keys.forEach(function(key, i) {
        var item = iteratable[key];
        item['@root'] = options.root;
        item['@key'] = key;
        item['@index'] = i;
        item['@first'] = i === 0;
        item['@last'] = i === (keys.length -1);
        options.fn(item);
      });
    }
  });
};
