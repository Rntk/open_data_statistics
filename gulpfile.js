var gulp = require('gulp');
var uglify = require('gulp-uglify');
var concat = require('gulp-concat');
var autoprefixer = require('gulp-autoprefixer');
var htmlmin = require('gulp-htmlmin');
var cssmin = require('gulp-cssmin');
var babel = require('gulp-babel');

gulp.task('babel_js', function() {
    return gulp.src([
        'src/ods.js'
    ])
    .pipe(babel({
        presets: ['es2015']
    }))
    .pipe(gulp.dest('src/ods_.js'));
});

gulp.task('uglify_js', ['babel_js'], function() {
    return gulp.src([
        'src/ods_.js'
    ])
    .pipe(uglify())
    .pipe(gulp.dest('src/ods_min.js'));
});

gulp.task('bundle.js', ['uglify.js'], function() {
    return gulp.src([
        'libs/*.js',
        'src/ods_min.js'
    ])
    .pipe(concat('bundle.js', {newLine: ';'}))
    .pipe(gulp.dest('dist/bundle.js'));
});

gulp.task('style_prefix', function() {
    return gulp.src([
        'css/style.css'
    ])
    .pipe(autoprefixer({browsers: ['> 1%']}))
    .pipe(gulp.dest('css/style.css'));
});

gulp.task('cssmin', ['style_prefix'], function() {
    return gulp.src([
        'style.css'
    ])
    .pipe(autoprefixer({browsers: ['> 1%']}))
    .pipe(gulp.dest('dist/style.css'));
});

gulp.task('htmlmin', function() {
    return gulp.src([
        'index.html'
    ])
    .pipe(htmlmin({collapseWhitespace: true}))
    .pipe(gulp.dest('dist'));
});

gulp.task('default', ['babel_js', 'uglify_js', 'bundle.js', 'style_prefix', 'cssmin', 'htmlmin']);