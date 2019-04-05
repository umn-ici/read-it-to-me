const gulp = require('gulp');
const rename = require('gulp-rename');
const uglify = require('gulp-uglify');
const pump = require('pump');
const sass = require('gulp-sass');
const sourcemaps = require('gulp-sourcemaps');
const babel = require('gulp-babel');

gulp.task('js', function (cb) {
  pump([
      gulp.src('src/js/read-it-to-me.js')
      .pipe(rename('read-it-to-me.min.js'))
      .pipe(babel({
        presets: ['env']
      })),
      uglify(),
      gulp.dest('dist/js')
    ],
    cb
  );
});

gulp.task('sass', function() {
  return gulp.src('src/scss/read-it-to-me.scss')
    .pipe(sourcemaps.init())
      .pipe(sass({outputStyle: 'compressed'}).on('error', sass.logError))
      .pipe(rename('read-it-to-me.min.css'))
    .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest('dist/css'));
});

gulp.task('watch', function(){
  gulp.watch('src/js/read-it-to-me.js', gulp.series('js'));
  gulp.watch('src/scss/*', gulp.series('sass'));
});

gulp.task('default', gulp.series('js', 'sass'));