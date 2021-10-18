var _ = require('lodash');
var pageSizes = require('./pageSizes');
var Container = require('./container');
var Processor = require('./processor');

var page = function(options, id) {
  this.id = 'page' + id;
  this.currentPage = id;
  this.document = options.document;
  var size = options.size || 'A4';
  this.margin = [0, 0, 0, 0];
  if (options.margins) {
    this.margin = [
      options.margins.left || 0,
      options.margins.top || 0,
      options.margins.right || 0,
      options.margins.bottom || 0
    ];
  }

  this.margins = {
    left: this.margin[0],
    top: this.margin[1],
    right: this.margin[2],
    bottom: this.margin[3]
  };

  this.header = null;
  if (options.header) {
    this.header = options.header.clone();
  }
  this.headerApplyed = false;

  this.footer = null;
  if (options.footer) {
    this.footer = options.footer.clone();
  }
  this.footerApplyed = false;

  var pageSize = [0, 0];
  if (typeof size === 'string') {
    pageSize = pageSizes[size];
  } else if (Array.isArray(size)) {
    pageSize = size;
  }

  Container.call(this, this, pageSize);
};

page.prototype = _.create(Container.prototype, {
  'constructor': page
});

page.prototype.setHeader = function(header) {
  this.header = header.clone();
};

page.prototype.setFooter = function(footer) {
  this.footer = footer.clone();
};

page.prototype.buildHeader = function() {
  if (this.header) {
    var width = this.width - this.margins.right - this.margins.left;
    var headerContainer = new Container(this.header, [width, Infinity]);
    headerContainer.lineEnd = true;
    var context = {
      parent: headerContainer,
      parentStyle: this.header,
      document: this.document
    };
    var headerProcessor = new Processor(context, this.header.content);
    headerProcessor.process();
    headerContainer.setHeight(headerContainer.getMinHeight());
    this.insert(headerContainer);
  }
};

page.prototype.BuildFooter = function() {
  var self = this;
  if (this.footer) {
    this.endOfLine();
    var width = this.width - this.margins.right - this.margins.left;
    var footerContainer = new Container(this.footer, [width, Infinity]);
    var context = {
      parent: footerContainer,
      parentStyle: this.footer,
      document: this.document
    };
    var footerProcessor = new Processor(context, this.footer.content);
    footerProcessor.process();
    var height = footerContainer.getMinHeight();
    footerContainer.setHeight(height);
    footerContainer.end();
    var x = this.margins.left;
    var y = this.height - this.margins.bottom - height;
    if (this.getAvailableHeight() > height) {
      footerContainer.container.forEach(function(node) {
        node.x += x;
        node.y += y;
        self.container.push(node);
      });
      // update margin bottom to avoid insert node in page footer
      this.margins.bottom += height;
    }
  }
};

page.prototype.end = function() {
  if (this.empty && this.header && !this.headerApplyed) {
    this.headerApplyed = true;
    this.buildHeader();
  }
  if (this.footer && !this.footerApplyed) {
    this.footerApplyed = true;
    this.BuildFooter();
  }
  Container.prototype.end.call(this);
};

page.prototype.insert = function(node) {
  if (this.empty && this.header && !this.headerApplyed) {
    this.headerApplyed = true;
    this.buildHeader();
  }
  if (this.footer && !this.footerApplyed) {
    this.footerApplyed = true;
    this.BuildFooter();
  }
  return Container.prototype.insert.call(this, node);
};

module.exports = page;
