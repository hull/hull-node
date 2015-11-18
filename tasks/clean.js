var del = require('del');
var path = require('path');

module.exports = function(gulp, dest) {
  gulp.task('clean', function() {
    return del([path.join(dest, '**', '*')]);
  });
};
