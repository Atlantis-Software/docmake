var _ = require('lodash');

module.exports = function(compiler) {
  compiler.registerHelper('each', function(iteratable, options) {
    if (arguments.length !== 2) {
      throw new Error('each require an argument');
    }
    if (!_.isArray(iteratable) && !_.isObject(iteratable)) {
      throw new Error('each require an array or an object as argument');
    }
    iteratable = _.cloneDeep(iteratable);
    if (_.isArray(iteratable)) {
      iteratable.forEach(function(Item, i) {
        let item = Item;
        if (!_.isObject(item)) {
          item = {};
        }
        item['$item'] = Item;
        item['$root'] = options.root;
        item['$key'] = i;
        item['$index'] = i;
        item['$first'] = i === 0;
        item['$last'] = i === (iteratable.length -1);
        options.fn(item);
      });
    } else {
      var keys = _.keys(iteratable);
      keys.forEach(function(key, i) {
        let Item = iteratable[key];
        let item = Item;
        if (!_.isObject(item)) {
          item = {};
        }
        item['$item'] = Item;
        item['$root'] = options.root;
        item['$key'] = key;
        item['$index'] = i;
        item['$first'] = i === 0;
        item['$last'] = i === (keys.length -1);
        options.fn(item);
      });
    }
  });
};
