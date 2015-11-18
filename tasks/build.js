var babel = require('gulp-babel');
var path = require('path');
var plumber = require('gulp-plumber');
var mkdirp = require('mkdirp');

module.exports = function(gulp, src, dest) {
  mkdirp.sync(dest);
  gulp.task('build', () => {
    return gulp.src(path.join(src, '**'))
      .pipe(plumber())
      .pipe(babel())
      .pipe(gulp.dest(dest));
  });
};
