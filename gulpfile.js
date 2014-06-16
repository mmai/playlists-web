/*globals require, console*/
var production = false;

var gulp = require('gulp'),
    jshint = require('gulp-jshint'),
    imagemin = require('gulp-imagemin'),
    plumber = require('gulp-plumber'),
    filesize = require('gulp-filesize'),
    concat = require('gulp-concat'),
    rename = require('gulp-rename'),
    rubySass = require('gulp-ruby-sass'),
    autoprefixer = require('gulp-autoprefixer'),

    browserify = require('browserify'),
    watchify = require('watchify'),
    debowerify = require('debowerify'),
    reactify = require('reactify'),

    browserSync = require('browser-sync'),
    source = require('vinyl-source-stream');

gulp.task('default', ['server', 'watch']);
gulp.task('compile', ['scripts', 'style', 'html', 'assets', 'vendor']);

gulp.task('server', function () {
  return browserSync.init(['build/js/*.js', 'build/main.css', 'build/index.html'], {
    server: {
      baseDir: './build'
    }
  });
});

gulp.task('watch', ['watchScripts', 'watchStyle', 'watchHtml']);

gulp.task('watchHtml', function () {
  return gulp.watch('src/index.html', function () {
    gulp.run('html');
  });
});

gulp.task('watchStyle', function () {
  return gulp.watch('src/sass/*.scss', function () {
    gulp.run('style');
  });
});

gulp.task('scripts', function() {
  return scripts(false);
});
 
gulp.task('watchScripts', function() {
  return scripts(true);
});

function scripts(watch) {
  var bundler, rebundle;
  var scriptFile = './src/js/app.jsx';

  if(watch) {
    bundler = watchify(scriptFile);
  } else {
    bundler = browserify(scriptFile);
  }
 
  bundler.transform(reactify).transform({global: true}, debowerify);
 
  rebundle = function() {
    var stream = bundler.bundle({debug: !production});
    stream.on('error', function(err){ console.log('Erreur browserify : ' + err);});
    stream = stream.pipe(source('bundle.js'));
    return stream.pipe(gulp.dest('build/js'));
  };
 
  bundler.on('update', rebundle);
  return rebundle();
}

// Prepare CSS
// ===========
// Compile SASS and add prefixes
gulp.task('style', function () {
    return gulp.src(['src/sass/main.scss'])
        .pipe(plumber())
        .pipe(filesize())    // .pipe(plugins.size({ showFiles: true }))
        .pipe(concat('main.scss'))
        .pipe(rubySass({ style: 'expanded' }))
        .pipe(autoprefixer('last 2 version', 'safari 5', 'ie 8', 'ie 9', 'opera 12.1', 'ios 6', 'android 4'))
        .pipe(filesize())    // .pipe(plugins.size({ showFiles: true }))
        .pipe(gulp.dest('build/'));
});

gulp.task('vendor', ['bootstrap:theme'], function () {
  return gulp.src('bower_components/**/*')
    .pipe(gulp.dest('build/vendor'));
});

// Copy bootswatch themes file to bootstrap directory
gulp.task('bootstrap:theme', function () {
    return gulp.src('bower_components/bootswatch/*/bootstrap.css')
    .pipe(rename( function(path){
                path.basename += '-' + path.dirname; 
                path.dirname = '';
            }))
        .pipe(gulp.dest('bower_components/bootstrap/dist/css' ));
});

gulp.task('html', function () {
  return gulp.src('src/index.html')
    .pipe(gulp.dest('build'));
});

gulp.task('assets', function () {
  return gulp.src(['src/assets/*.png', 'src/assets/*.jpg'])
    .pipe(imagemin())
    .pipe(gulp.dest('build/assets'));
});

