var asynk = require("asynk");
var _ = require('lodash');

var element = function(emitter, node, context) {
  this.emitter = emitter;
  this.node = node;
  this.context = context;
  this.options = {
    hash: {},
    transclude: function() {
      // only block can transclude
      var err = new Error('tag ' + node.name + ' require a # on open and a / on close');
      err.position = node.position;
      throw err;
    }
  };
};

element.prototype.emitAttributes = function(cb) {
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

element.prototype.emitParams = function(cb) {
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

element.prototype.emit = function() {
  var self = this;
  var end = asynk.deferred();

  if (this.emitter.helpers[this.node.name]) {
    asynk.add(this.emitAttributes.bind(this)).add(this.emitParams.bind(this)).parallel().asCallback(function(err, res) {
      if (err) {
        err.position = self.node.position;
        return end.reject(err);
      }
      var args = res[1];
      args.push(self.options);
      try {
        var element = self.emitter.helpers[self.node.name].apply(self.context, args);
      } catch (e) {
        e.position = self.node.position;
        return end.reject(e);
      }
      end.resolve(element);
    });
  } else {
    var err = new Error('unknown tag ' + this.node.name);
    err.position = this.node.position;
    end.reject(err);
  }
  return end.promise(this);
};

module.exports = element;