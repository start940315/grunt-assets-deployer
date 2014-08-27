'use strict';

require('should');
var fs = require('fs');
var qn = require('qn');
var config = require('./config');

var pending = function (n, fn) {
  return function (err) {
    if (err) { return fn(err); }
    if (!(--n)) {
      fn();
    }
  }
};

describe('Deploy resources to qiniu', function () {
  before(function () {
    this.client = qn.create({
      accessKey: config.ACCESS_KEY,
      secretKey: config.SECRET_KEY,
      bucket: config.bucket_name,
      domain: config.domain,
      timeout: 60 * 1000
    });
  });

  it('should upload all resources to qiniu', function (done) {

    var that_done = pending(2, done);

    this.client.download('assets/js/main.js', function (err, data) {
      if (err) { throw err; }
      var expected = fs.readFileSync('./test/fixtures/assets/js/main.js', 'utf8');
      expected.should.equal(data.toString());
      that_done();
    });

    this.client.download('assets/css/main.css', function (err, data) {
      if (err) { throw err; }
      var expected = fs.readFileSync('./test/fixtures/assets/css/main.css', 'utf8');
      expected.should.equal(data.toString());
      that_done();
    });
  });

  after(function (done) {
    var that_done = pending(2, done);
    this.client.delete('assets/js/main.js', that_done);
    this.client.delete('assets/css/main.css', that_done);
  });
});
