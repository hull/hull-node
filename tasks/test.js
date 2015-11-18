var mocha = require('gulp-mocha');

module.exports = function(gulp, spec) {
  gulp.task('tests:run', function() {
    return gulp.src(spec, { read: false })
    .pipe(mocha());
  });

  gulp.task('tests:watch', function() {
    gulp.watch(spec, ['tests:run']);
  });
}
