var DOMParser = require('xmldom').DOMParser;
module.exports = function (xml) {
  var doc = new DOMParser().parseFromString(xml);
  var toJSON = function (node) {
    node = node || this;
    var obj = {};
    if (node.tagName) {
      obj.name = node.tagName.toLowerCase();
    } else if (node.nodeName) {
      obj.nodeName = node.nodeName;
    }
    if (node.nodeValue) {
      obj.val = node.nodeValue;
    }
    if (node.attributes) {
      obj.attr = {};
      for (let i = 0; i < node.attributes.length; i++) {
        var attr = node.attributes[i];
        obj.attr[attr.nodeName] = attr.nodeValue;
      }
    }
    if (node.childNodes) {
      obj.children = [];
      for (let i = 0; i < node.childNodes.length; i++) {
        if (node.childNodes[i].tagName) {
          obj.children.push(toJSON(node.childNodes[i]));
        } else if (node.childNodes[i].nodeValue) {
          obj.val = obj.val || "";
          obj.val += node.childNodes[i].nodeValue;
        }
      }
    }
    return obj;
  };
  return toJSON(doc.documentElement);
};
