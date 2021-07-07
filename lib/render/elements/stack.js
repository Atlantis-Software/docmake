var Container = require('../container');
var utils = require('../utils');

module.exports = function(Processor, document, parent, node) {
  node.id = 'stack';
  node.class = node.class || [];
  node.class.unshift('stack');
  node.width = utils.parseDimension(parent.getAvailableWidth(), node.width);
  var stackContainer = new Container(node, [node.width, node.height || Infinity]);
  var stackContext = {
    parent: stackContainer,
    parentStyle: node,
    document
  };
  var stackProcessor = new Processor(stackContext, node.stack);
  stackProcessor.process();
  stackContainer.setHeight(stackContainer.getMinHeight());
  stackContainer.lineEnd = true;
  return stackContainer;
};
