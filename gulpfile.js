var fs = require('fs');
var connect = require('gulp-connect');
var gulp = require('gulp');
// var karma = require('karma').server;
var concat = require('gulp-concat');
var jshint = require('gulp-jshint');
var header = require('gulp-header');
var rename = require('gulp-rename');
var es = require('event-stream');
var del = require('del');
var uglify = require('gulp-uglify');
var minifyHtml = require('gulp-minify-html');
var minifyCSS = require('gulp-minify-css');
var templateCache = require('gulp-angular-templatecache');
var gutil = require('gulp-util');
var plumber = require('gulp-plumber');
var open = require('gulp-open');
var less = require('gulp-less');
var order = require("gulp-order");


var config = {
  pkg: JSON.parse(fs.readFileSync('./package.json')),
  banner: '/*!\n' +
    ' * <%= pkg.name %>\n' +
    ' * <%= pkg.homepage %>\n' +
    ' * Version: <%= pkg.version %> - <%= timestamp %>\n' +
    ' * License: <%= pkg.license %>\n' +
    ' */\n\n\n'
};

gulp.task('connect', function() {
  connect.server({
    root: [__dirname],
    port: 3002,
    livereload: true
  });
});

gulp.task('html', function() {
  gulp.src(['./demo/*.html', '.src/*.html'])
    .pipe(connect.reload());
});

gulp.task('images', ['clean'], function() {
  return gulp.src('./src/assets/images/**/*')
    .pipe(gulp.dest('./dist/assets/images/'));
});

gulp.task('watch', function() {
  gulp.watch(['./demo/**/*.html'], ['html']);
  gulp.watch(['./**/*.less'], ['styles']);
  gulp.watch(['./src/**/*.js', './demo/**/*.js', './**/*.html'], ['scripts']);
});

gulp.task('clean', function(cb) {
  del(['dist/**/*'], cb);
});

gulp.task('styles', function() {
  gulp.src('src/directive.less')
    .pipe(less())
    .pipe(header(config.banner, {
      timestamp: (new Date()).toISOString(),
      pkg: config.pkg
    }))
    .pipe(gulp.dest('dist'))
    .pipe(minifyCSS())
    .pipe(rename({ suffix: '.min' }))
    .pipe(gulp.dest('dist'))
    .pipe(connect.reload());
});

gulp.task('scripts', ['clean'], function() {

  function buildTemplates() {
    return gulp.src('src/**/*.html')
      .pipe(minifyHtml({
        empty: true,
        spare: true,
        quotes: true
      }))
      .pipe(templateCache({ module: 'rs.datagrid' }));
  };

  function buildFilterJS() {
    return gulp.src('src/filter/*.js')
      .pipe(plumber({
        errorHandler: handleError
      }))
      .pipe(jshint())
      .pipe(jshint.reporter('jshint-stylish'))
      .pipe(jshint.reporter('fail'));
  };

  function buildDistJS() {
    return gulp.src('src/directive.js')
      .pipe(plumber({
        errorHandler: handleError
      }))
      .pipe(jshint())
      .pipe(jshint.reporter('jshint-stylish'))
      .pipe(jshint.reporter('fail'));
  };

  gulp.src('src/directive.less')
    .pipe(less())
    .pipe(header(config.banner, {
      timestamp: (new Date()).toISOString(),
      pkg: config.pkg
    }))
    .pipe(gulp.dest('dist'))
    .pipe(minifyCSS())
    .pipe(rename({ suffix: '.min' }))
    .pipe(gulp.dest('dist'))
    .pipe(connect.reload());

  gulp.src('./src/assets/images/**/*')
    .pipe(gulp.dest('./dist/assets/images/'))
    .pipe(connect.reload());

  es.merge(buildDistJS(), buildFilterJS(),  buildTemplates())
    .pipe(plumber({
      errorHandler: handleError
    }))
    .pipe(order([
      'directive.js',
      'propsFilter.js',
      'template.js'
    ]))
    .pipe(concat('directive.js'))
    .pipe(header(config.banner, {
      timestamp: (new Date()).toISOString(),
      pkg: config.pkg
    }))
    .pipe(gulp.dest('dist'))
    .pipe(rename({ suffix: '.min' }))
    .pipe(uglify({ preserveComments: 'some' }))
    .pipe(gulp.dest('./dist'))
    .pipe(connect.reload());
});

gulp.task('open', function() {
  gulp.src('./demo/demo.html')
    .pipe(open('', { url: 'http://localhost:3002/demo/demo.html' }));
});

gulp.task('jshint-test', function() {
  return gulp.src('./test/**/*.js').pipe(jshint());
})

gulp.task('karma', function(done) {
  karma.start({
    configFile: __dirname + '/karma.conf.js',
    singleRun: true
  }, done);
});

gulp.task('karma-serve', function(done) {
  karma.start({
    configFile: __dirname + '/karma.conf.js'
  }, done);
});

function handleError(err) {
  console.log(err.toString());
  this.emit('end');
};

gulp.task('build', ['scripts']);
gulp.task('serve', ['build', 'images', 'connect', 'watch', 'open']);
gulp.task('default', ['build', 'test']);
gulp.task('test', ['build', 'jshint-test', 'karma']);
gulp.task('serve-test', ['build', 'watch', 'jshint-test', 'karma-serve']);
