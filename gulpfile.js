const gulp = require('gulp');
const gulpSass = require('gulp-sass');
const autoprefixer = require('gulp-autoprefixer');
const browserSync = require('browser-sync').create();
const useref = require('gulp-useref');
const uglify = require('gulp-uglify');
const cssnano = require('gulp-cssnano');
const imagemin = require('gulp-imagemin');
const cache = require('gulp-cache');
const gulpIf = require('gulp-if');
const del = require('del');
const runSequence = require('run-sequence');
const htmlmin = require('gulp-htmlmin');
const serve = require('gulp-serve');


gulp.task('browserSync', function () {
    browserSync.init({
        server: {
            baseDir: ['./', './app']
        }
    });
});

gulp.task('build:css', function () {
    return gulp.src('app/scss/main.scss')
        .pipe(gulpSass())
        .pipe(autoprefixer())
        .pipe(gulp.dest('app/css'))
        .pipe(browserSync.reload({
            stream: true
        }));
});

gulp.task('clean:dist', function () {
    return del.sync('dist');
});

gulp.task('cache:clear', function () {
    return cache.clearAll()
});

gulp.task('build:dist:bundle', function () {
    return gulp.src('app/*.html')
        .pipe(useref())
        .pipe(gulpIf('*.js', uglify()))
        .pipe(gulpIf('*.css', cssnano()))
        .pipe(gulp.dest('dist'));
});

gulp.task('build:dist:html', function () {
    return gulp.src('dist/*.html')
        .pipe(htmlmin({collapseWhitespace: true}))
        .pipe(gulp.dest('dist'));
});

gulp.task('build:dist:fonts', function () {
    return gulp.src('app/fonts/**/*')
        .pipe(gulp.dest('dist/fonts'));
});

gulp.task('build:dist:drawable', function () {
    return gulp.src('app/drawable/**/*.+(png|jpg|gif|svg)')
        .pipe(cache(imagemin({
            interlaced: true
        })))
        .pipe(gulp.dest('dist/drawable'));
});

gulp.task('build:dist', function () {
    runSequence('build:css', 'build:dist:fonts', 'build:dist:drawable', 'build:dist:bundle', 'build:dist:html');
});

gulp.task('watch', ['browserSync'], function () {
    gulp.watch('app/scss/**/*.scss', ['build:css']);
    gulp.watch('app/*.html', browserSync.reload);
    gulp.watch('app/js/**/*.js', browserSync.reload);
});

gulp.task('serve', serve(['dist']));