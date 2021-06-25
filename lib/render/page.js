var _ = require('lodash');
var style = require('./style');
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
  this.header = _.cloneDeep(options.header) || null;
  this.footer = _.cloneDeep(options.footer) || null;
  var pageSize = [0, 0];
  if (typeof size === 'string') {
    pageSize = pageSizes[size];
  } else if (Array.isArray(size)) {
    pageSize = size;
  }
  style(this.document, this.document, this);
  Container.call(this, this, pageSize);
  this.buildHeader();
  this.BuildFooter();
};

page.prototype = _.create(Container.prototype, {
  'constructor': page
});

page.prototype.setHeader = function(header) {
  if (this.empty) {
    this.header = _.cloneDeep(header);
    this.buildHeader();
  }
};

page.prototype.setFooter = function(footer) {
  this.footer = _.cloneDeep(footer);
  this.BuildFooter();
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
    var headerProcessor = new Processor(context, this.header.pageHeader);
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
    var footerProcessor = new Processor(context, this.footer.pageFooter);
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
  Container.prototype.end.call(this);
};

module.exports = page;
