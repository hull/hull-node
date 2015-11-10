'use strict';
/* global require, console*/
require('babel/register');

var gulp = require('gulp');
var mocha = require('gulp-mocha');
var files = ['spec/*'];

gulp.task('tests:run', function() {
  return gulp.src(files, { read: false }).pipe(mocha());
});

gulp.task('tests:watch', function() {
  gulp.watch(files, ['tests:run']);
});
