'use strict';

var config = require('./test/config');

module.exports = function (grunt) {

  grunt.initConfig({
    jshint: {
      all: ['Gruntfile.js', 'index.js', 'tasks/*.js', '<%= mochaTest.test.src %>' ],
      options: {
        jshintrc: '.jshintrc'
      }
    },

    clean: {
      tests: ['.tmp']
    },

    qiniu: {
      options: {
        ACCESS_KEY: config.ACCESS_KEY,
        SECRET_KEY: config.SECRET_KEY,
        bucket_name: config.bucket_name,
        domain: config.domain
      },

      resources: [
        {
          prefix: 'public/',
          cwd: 'test/fixtures',
          pattern: '**/*.*'
        }
      ]
    },

    mochaTest: {
      test: {
        options: {
          reporter: 'spec',
          timeout: 60000
        },
        src: ['test/deploy_test.js']
      }
    }
  });

  grunt.loadTasks('tasks');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-mocha-test');

  grunt.registerTask('test', ['clean', 'qiniu', 'mochaTest', 'clean']);
  grunt.registerTask('default', ['jshint', 'test']);
};