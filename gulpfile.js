var gulp = require('gulp');
var uglify = require('gulp-uglify');
var concat = require('gulp-concat');
var autoprefixer = require('gulp-autoprefixer');
var htmlmin = require('gulp-htmlmin');
var cssmin = require('gulp-cssmin');
var babel = require('gulp-babel');
var replace = require('gulp-replace');
var rename = require('gulp-rename');

gulp.task('babel_js', function() {
    return gulp.src([
        'src/ods.js'
    ])
    .pipe(babel({
        presets: ['es2015']
    }))
    .pipe(rename({suffix: '_'}))
    .pipe(gulp.dest('src'));
});

gulp.task('uglify_js', ['babel_js'], function() {
    return gulp.src([
        'src/ods_.js'
    ])
    .pipe(uglify())
    .pipe(rename({suffix: '.min'}))
    .pipe(gulp.dest('src'));
});

gulp.task('bundle.js', ['uglify_js'], function() {
    return gulp.src([
        'libs/*.js',
        'src/ods_.min.js'
    ])
    .pipe(concat('bundle.js', {newLine: ';'}))
    .pipe(gulp.dest('dist'));
});

gulp.task('style.css', function() {
    return gulp.src([
        'css/style.css'
    ])
    .pipe(autoprefixer({browsers: ['> 1%']}))
    .pipe(cssmin())
    .pipe(rename({suffix: '.min'}))
    .pipe(gulp.dest('dist'));
});

gulp.task('htmlmin', function() {
    return gulp.src([
        'index.html'
    ])
    .pipe(replace('css/style.css', 'style.min.css'))
    .pipe(replace('<script type="text/javascript" src="libs/Chart.min.js"></script>', ''))
    .pipe(replace('<script type="text/javascript" src="libs/polyfill.min.js"></script>', ''))
    .pipe(replace('http://127.0.0.1:9876/r.php', 'http://rntk.kz/od/r.php'))
    .pipe(replace('src/ods_.js', 'bundle.js'))
    .pipe(htmlmin({collapseWhitespace: true}))
    .pipe(gulp.dest('dist'));
});

gulp.task('default', ['babel_js', 'uglify_js', 'bundle.js', 'style.css', 'htmlmin']);