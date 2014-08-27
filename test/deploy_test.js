'use strict';

var fs = require('fs');
var qn = require('qn');
var config = require('./config');

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

  it('should upload all resources to qiniu', function () {

    this.client.download('assets/js/main.js', function (err, data) {
      if (err) {
        throw err;
      }
      var expected = fs.readFileSync('test/fixtures/assets/js/main.js', 'utf8');
      console.log(expected);
      expected.should.equal(data.toString());
    });

    this.client.download('css/grunt_qiniu_deploy_test.css', function (err, data) {
      if (err) {
        throw err;
      }
      var expected = fs.readFileSync('test/fixtures/assets/css/main.css', 'utf8');
      expected.should.equal(data.toString());
    });
  });

  after(function () {
    this.client.delete('assets/js/main.js');
    this.client.delete('assets/css/main.css');
  });
});