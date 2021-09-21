var _ = require('lodash');

var utils = {};

utils.normalizeSpace = function(space) {
  if (_.isNumber(space)) {
    return [space, space, space, space];
  }
  if (_.isArray(space)) {
    if (space.length === 2) {
      return [space[0], space[1], space[0], space[1]];
    }
    if (space.length === 4) {
      return space;
    }
  }
  throw new Error('Invalid space');
};

utils.validate = function(type) {
  if (_.isArray(type)) {
    return function(val) {
      return type.includes(val);
    };
  }
  switch (type) {
    case "boolean":
      return _.isBoolean;
    case "string":
      return _.isString;
    case "number":
      return _.isNumber;
    case "space":
      return this.validateSpace;
    case "colors":
      return this.validateColors;
  }
};

utils.validateSpace = function(space) {
  if (_.isNumber(space)) {
    return true;
  }
  if (_.isArray(space)) {
    if (space.length === 2 && _.isNumber(space[0]) && _.isNumber(space[1])) {
      return true;
    }
    if (space.length === 4 && _.isNumber(space[0]) && _.isNumber(space[1]) && _.isNumber(space[2]) && _.isNumber(space[3])) {
      return true;
    }
  }
  return false;
};

utils.validateColors = function(color) {
  if (_.isString(color)) {
    return true;
  }
  if (_.isArray(color) && (color.length === 2 || color.length === 4)) {
    return true;
  }
  return false;
};

utils.expandSpace = function(space) {
  space = this.normalizeSpace(space);
  return {
    left: space[0],
    top: space[1],
    right: space[2],
    bottom: space[3]
  };
};

utils.parseDimension = function(reference, dimension) {
  if (_.isString(dimension)) {
    if (dimension.endsWith('%')) {
      var percent = parseFloat(dimension.slice(0, -1));
      if (_.isNaN(percent)) {
        return reference;
      }
      return reference * percent / 100;
    } else {
      var num = parseFloat(dimension);
      if (!_.isNaN(num)) {
        return num;
      } else {
        return reference;
      }
    }
  } else if (_.isNumber(dimension)) {
    return dimension;
  }
  return reference;
};

module.exports = utils;
