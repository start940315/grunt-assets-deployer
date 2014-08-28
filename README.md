# grunt-assets-deployer [![Build Status](https://travis-ci.org/Novtopro/grunt-assets-deployer.svg?branch=master)](https://travis-ci.org/Novtopro/grunt-assets-deployer) [![NPM version](https://badge.fury.io/js/grunt-assets-deployer.svg)](http://badge.fury.io/js/grunt-assets-deployer)

![Photo](http://novtopro.qiniudn.com/images/c/0f/6da7ea7081eebbe01694240480be1.jpg)
   
## About

因为个人Ghost博客（ http://track-novtopro.rhcloud.com/ ）是在OpenShift上，由于总所周知的原因，访问比较慢，所以想把一些静态资源放在七牛云存储。开始的时候我想使用 grunt-qiniu-deploy（ https://github.com/chenboxiang/grunt-qiniu-deploy ），但是作者有一段时间没有更新，并且不支持同名文件的更新操作， 所以自己基于他的代码写了这么个Grunt plugin，在此对他表示感谢。

## Usage

```javascript
'use strict';

var config = require('./test/config');

module.exports = function (grunt) {

  grunt.initConfig({
    qiniu: {
      options: {
        ACCESS_KEY: config.ACCESS_KEY,
        SECRET_KEY: config.SECRET_KEY,
        bucket_name: config.bucket_name,
        domain: config.domain
      },

      resources: [
        {
          cwd: 'test/fixtures',
          // 上传到七牛后加上指定前缀, 如上传assets/css/main.css, 上传之后的URL变成 http://bucket_name.qiniudn.com/public/assets/css/main.css
          prefix: 'public/',
          pattern: '**/*.*'
        }
      ]
    }
  });

  grunt.loadTasks('tasks');
  grunt.loadTasks('grunt-assets-deployer');
  
  grunt.registerTask('qiniu');
};
```
