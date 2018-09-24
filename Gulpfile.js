const gulp = require('gulp');
const livereload = require('gulp-livereload');
const sass = require('gulp-sass');
const rename = require('gulp-rename');
const babelify = require('babelify');
const browserify = require('browserify');
const source = require('vinyl-source-stream');
const watchify = require('watchify');


// Css
gulp.task('styles', () => sass_compile());

gulp.task('styles:live', () => sass_compile().pipe(livereload({ start: true })))

gulp.task('styles:watch', ['styles'], () => {
  return gulp.watch(['./src/sass/*.scss', './src/sass/**/*.scss'], ['styles:live'])
})

function sass_compile() {
  return gulp
    .src('src/sass/main.scss')
    .pipe(sass())
    .pipe(rename('app.css'))
    .pipe(gulp.dest('./public'));
}

// Javascript
function compile(watch) {
  // var bundle_watch = watchify(browserify('./static/js/index.js'));
  var bundle = browserify('./src/js/main.js');

  function rebundle() {
    bundle
      .transform(babelify)
      .bundle()
      .on('error', (err) => { console.log(err); this.emit('end'); })
      .pipe(source('main.js'))
      .pipe(rename('app.js'))
      .pipe(gulp.dest('./public'));
  }

  if (watch) {
    watchify(bundle).on('update', () => {
      console.log('--> Bundling...');
      rebundle();
    })
  }

  rebundle()
}

gulp.task('default', ['styles', 'build']);
gulp.task('watch', ['styles:watch', 'build:watch']);
gulp.task('build', () => { return compile() });
gulp.task('build:watch', () => { return compile(true) });
