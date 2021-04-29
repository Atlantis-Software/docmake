var asynk = require("asynk");
var _ = require('lodash');

var block = function(emitter, node, context) {
  var self = this;
  this.emitter = emitter;
  this.node = node;
  this.context = context;

  this.contents = [];
  this.transclude_contents = [];
  this.options = {
    root: self.emitter.root,
    data: context,
    name: node.name,
    hash: {},
    fn: function(ctx) {
      ctx = ctx || context;
      self.node.contents.forEach(function(node) {
        self.contents.push(self.emitter.emit(node, ctx));
      });
    },
    transclude(ctx) {
      ctx = ctx || context;
      node.contents.forEach(function(node) {
        self.transclude_contents.push(self.emitter.emit(node, ctx));
      });
      return self.transclude_contents;
    }
  };
};

block.prototype.emitAttributes = function(cb) {
  var self = this;
  var attrs = _.keys(this.node.hash);
  if (attrs.length === 0) {
    return cb(null, {});
  }
  var attributes = [];
  attrs.forEach(function(key) {
    var attr = self.emitter.emit(self.node.hash[key], self.context);
    attr.key = key;
    attributes.push(attr);
  });
  asynk.when.apply(asynk, attributes).done(function() {
    asynk.each(attributes, function(attr, cb) {
      attr.done(function(value) {
        self.options.hash[attr.key] = value;
        cb();
      });
    }).serie().done(function() {
      cb(null, self.options.hash);
    });
  }).fail(cb);
};

block.prototype.emitParams = function(cb) {
  var self = this;
  if (this.node.params.length === 0) {
    return cb(null, []);
  }
  var params = [];
  this.node.params.forEach(function(param) {
    params.push(self.emitter.emit(param, self.context));
  });
  asynk.when.apply(asynk, params).done(function() {
    asynk.each(params, function(param, cb) {
      param.done(function(param) {
        cb(null, param);
      });
    }).serie().done(function(params) {
      cb(null, params);
    });
  }).fail(cb);
};

block.prototype.emitContents = function(cb) {
  var self = this;
  if (this.contents.length === 0) {
    return cb(null, []);
  }
  var contents = [];
  asynk.when.apply(asynk, this.contents).done(function() {
    asynk.each(self.contents, function(content, cb) {
      content.done(function(item) {
        if (content instanceof block) {
          contents = Array.prototype.concat(contents, item);
        } else {
          contents.push(item);
        }
        cb();
      });
    }).serie().done(function() {
      cb(null, contents);
    });
  }).fail(cb);
};

block.prototype.emitTranscludeContents = function(cb) {
  var self = this;
  if (this.transclude_contents.length === 0) {
    return cb(null, []);
  }
  asynk.when.apply(asynk, this.transclude_contents).done(function() {
    var contents = [];
    asynk.each(self.transclude_contents, function(content, cb) {
      content.done(function(item) {
        if (content instanceof block) {
          contents = Array.prototype.concat(contents, item);
        } else {
          contents.push(item);
        }
        cb(null, item);
      });
    }).serie().done(function() {
      contents.forEach(function(content, index) {
        self.transclude_contents[index] = content;
      });
      cb(null, self.transclude_contents);
    });
  }).fail(cb);
};

block.prototype.emit = function() {
  var self = this;
  var end = asynk.deferred();

  if (this.emitter.helpers[this.node.name]) {
    asynk.add(this.emitAttributes.bind(this)).add(this.emitParams.bind(this)).parallel().asCallback(function(err, res) {
      if (err) {
        return end.reject(err);
      }
      var args = res[1];
      args.push(self.options);
      var elements = [];
      var element = self.emitter.helpers[self.node.name].apply(self.context, args);
      if (element) {
        elements.push(element);
      }
      asynk.add(self.emitContents.bind(self)).add(self.emitTranscludeContents.bind(self)).parallel().asCallback(function(err, res) {
        if (err) {
          return end.reject(err);
        }
        var contents = res[0];
        elements = elements.concat(contents);
        end.resolve(elements);
      });
    });
  } else {
    end.resolve('TODO');
  }
  return end.promise(this);
};

module.exports = block;
