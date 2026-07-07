(function () {
    const ROUTES = {
        home: 'index.html',
        courses: 'courses.html',
        dashboard: 'dashboard.html',
        login: 'login.html',
        register: 'register.html',
        courseView: 'course-view.html',
        studentLesson: 'student/lesson.html'
    };

    function buildQuery(query) {
        if (!query || typeof query !== 'object') return '';

        const pairs = Object.keys(query)
            .filter((key) => query[key] !== undefined && query[key] !== null)
            .map((key) => encodeURIComponent(key) + '=' + encodeURIComponent(String(query[key])));

        return pairs.length ? '?' + pairs.join('&') : '';
    }

    function path(name, options) {
        const opts = Object.assign({ fromStudent: false, query: null }, options || {});
        const raw = ROUTES[name] || name;

        if (!opts.fromStudent) {
            return raw + buildQuery(opts.query);
        }

        if (raw.indexOf('student/') === 0) {
            return raw.replace(/^student\//, '') + buildQuery(opts.query);
        }

        return '../' + raw + buildQuery(opts.query);
    }

    window.SwordRoutes = {
        ROUTES,
        path
    };
})();
