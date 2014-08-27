'use strict';

var qn = require('qn');
var glob = require('glob');
var async = require('async');
var path = require('path');

module.exports = function (grunt) {

  grunt.registerMultiTask('qiniu', 'qiniu upload grunt task', function () {

    var done = this.async();

    var options = this.options({
      domain: 'http://{bucket}.qiniudn.com',

      // timeout 1 minute
      timeout: 60 * 1000,

      // 生成qiniu上的存储路径(key)
      keyGen: function (cwd, file) {
        return file;
      }
    });

    if (!options.ACCESS_KEY || !options.SECRET_KEY || !options.bucket_name) {
      grunt.fail.fatal('ACCESS_KEY, SECRET_KEY and bucket_name are required!');
    }

    // 替换掉domain中的bucket
    options.domain = options.domain.replace('{bucket}', options.bucket_name);

    var resources = this.data;
    if (!Array.isArray(resources)) {
      resources = [resources];
    }

    // 转换成绝对路径
    resources.forEach(function (res) {
      res.cwd = res.cwd || process.cwd();
      if (path.resolve(res.cwd) !== res.cwd) {
        res.cwd = path.join(process.cwd(), res.cwd);
      }
    });

    // config client
    var client = qn.create({
      accessKey: options.ACCESS_KEY,
      secretKey: options.SECRET_KEY,
      bucket: options.bucket_name,
      domain: options.domain,
      timeout: options.timeout
    });

    // resource files
    var resourceFiles = [];
    resources.forEach(function (o) {
      var files = [];

      if (!Array.isArray(o.pattern)) {
        o.pattern = [o.pattern];
      }

      o.pattern.forEach(function (p) {
        files = files.concat(glob.sync(p, {
          cwd: o.cwd
        }))
      });

      resourceFiles.push({
        cwd: o.cwd,
        files: files
      })
    });

    grunt.verbose.ok('resources: ' + JSON.stringify(resourceFiles, null, 4));

    // construct upload tasks
    var uploadTasks = [];
    resourceFiles.forEach(function (o) {
      var cwd = o.cwd;
      o.files.forEach(function (file) {
        uploadTasks.push(makeUploadTask(cwd, file));
      })
    });

    grunt.log.ok('Start uploading resources ...');

    // upload
    async.series(uploadTasks, function (err, results) {
      if (err) {
        grunt.fail.fatal(err);
      } else {
        grunt.log.ok('All resources has been uploaded !');
      }
      done(err, results);
    });

    // construct upload task
    function makeUploadTask(cwd, file) {
      function doUpload(callback) {
        var absolutePath = path.join(cwd, file);
        var key = options.keyGen(cwd, file);

        grunt.log.ok('Start uploading file: ' + file);

        client.uploadFile(absolutePath, {key: key}, function (err, result) {
          if (!err) {
            grunt.log.ok('Upload success !');
          }
          callback(err, result);
        });
      }

      return function (callback) {
        client.stat(file, function () {
          doUpload(callback);
        });
      }
    }
  })
};