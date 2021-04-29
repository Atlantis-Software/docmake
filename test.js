var mocha = require('mocha');
var fs = require('fs');
var path = require('path');

var getJSFiles = function(dir) {
  var files = [];
  var list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = path.join(dir, file);
    var stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      files = files.concat(getJSFiles(file));
    } else if (file.endsWith('.js')) {
      files.push(file);
    }
  });
  return files;
};

var test = new mocha({
  bail: false,
  reporter: 'spec',
  timeout: 200
});

getJSFiles(path.join(__dirname, 'tests')).forEach(function(file) {
  test.addFile(file);
});

var runner = test.run(function(err) {
  if (err) {
    process.exit(1);
  } else {
    process.exit(0);
  }
});

runner.on('fail', function(e) {
  /* eslint-disable no-console */
  console.error(e.err);
  /* eslint-enable no-console */
});
