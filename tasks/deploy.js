'use strict';

var qn = require('qn');
var glob = require('glob');
var async = require('async');
var path = require('path');
var fs = require('fs');
var crypto = require('crypto');

module.exports = function (grunt) {

  grunt.registerMultiTask('qiniu', 'qiniu upload grunt task', function () {

    var done = this.async();

    var options = this.options({
      domain: 'http://{bucket}.qiniudn.com',

      // timeout 1 minute
      timeout: 60 * 1000,

      // 生成qiniu上的存储路径(key)
      keyGen: function (cwd, prefix, file) {
        return prefix + file;
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
      res.prefix = res.prefix || '';
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
        prefix: o.prefix,
        files: files
      })
    });

    grunt.verbose.ok('resources: ' + JSON.stringify(resourceFiles, null, 4));

    // construct upload tasks
    var uploadTasks = [];
    resourceFiles.forEach(function (o) {
      var cwd = o.cwd;
      var prefix = o.prefix;
      o.files.forEach(function (file) {
        uploadTasks.push(makeUploadTask(cwd, prefix, file));
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
    function makeUploadTask(cwd, prefix, file) {
      var absolutePath = path.join(cwd, file);

      function doUpload(callback) {
        var key = options.keyGen(cwd, prefix, file);

        grunt.log.ok('Start uploading file: ' + file);

        client.uploadFile(absolutePath, {key: key}, function (err, result) {
          if (!err) {
            grunt.log.ok('Upload success !');
          }
          callback(err, result);
        });
      }

      return function (callback) {
        client.stat(file, function (err, stat) {
          if (err || stat.error) {
            doUpload(callback);
          } else {
            // 只有当文件有变化的时候才更新
            var currentFileHash = qiniuFileEtag(absolutePath);
            if (stat.hash != currentFileHash) {
              client.delete(file, function (err) {
                if (!err) {
                  doUpload(callback);
                }
              });
            }
          }
        });
      }
    }

    // 计算七牛文件HASH值，以便对同名文件进行更新
    function qiniuFileEtag(file) {
      var f = fs.readFileSync(file);

      if (f.length > (1 << 22)) {
        return false;
      }

      var shasum = crypto.createHash('sha1');
      shasum.update(f);
      var sha1 = shasum.digest();
      var hash = new Buffer(1 + sha1.length);
      hash[0] = 0x16;
      sha1.copy(hash, 1);
      return hash.toString('base64').replace('+', '-').replace('/', '_');
    }
  })
};
