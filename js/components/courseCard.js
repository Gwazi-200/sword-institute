// js/components/courseCard.js – Course card renderer
export const courseCard = {
    create(course, user) {
        const card = document.createElement('div');
        card.className = 'course-card';
        card.dataset.courseId = course.id;

        // Image and badges
        const imageHtml = `
            <div class="card-image">
                <img src="${course.image || '/images/placeholder.jpg'}" alt="${course.title}" loading="lazy" />
                <div class="badges">
                    ${course.featured ? '<span class="badge-chip featured">Featured</span>' : ''}
                    ${course.popular ? '<span class="badge-chip popular">Popular</span>' : ''}
                    ${course.certificate ? '<span class="badge-chip certificate">Certificate</span>' : ''}
                </div>
            </div>
        `;

        // Progress (if user and enrolled)
        let progressHtml = '';
        if (user && course.progress !== undefined && course.progress !== null) {
            const pct = Math.min(100, Math.max(0, course.progress));
            progressHtml = `
                <div class="progress-wrapper">
                    <label>Progress <span>${pct}%</span></label>
                    <progress value="${pct}" max="100"></progress>
                </div>
            `;
        }

        const bodyHtml = `
            <div class="card-body">
                <h3>${course.title}</h3>
                <div class="course-meta">
                    <span><i class="fas fa-user"></i> ${course.instructor || 'Instructor'}</span>
                    <span class="rating"><i class="fas fa-star"></i> ${course.rating?.toFixed(1) || '0'}</span>
                    <span><i class="fas fa-clock"></i> ${course.estimatedHours || 0}h</span>
                    <span><i class="fas fa-users"></i> ${course.students || 0}</span>
                </div>
                <div class="course-description">${course.shortDescription || ''}</div>
                ${progressHtml}
                <div class="card-actions">
                    <button class="btn-primary" data-action="enroll" data-id="${course.id}">
                        ${user && course.progress !== undefined ? 'Continue' : 'Enroll'}
                    </button>
                    <button class="btn-outline" data-action="detail" data-id="${course.id}">Details</button>
                </div>
            </div>
        `;

        card.innerHTML = imageHtml + bodyHtml;

        // Event delegation for buttons
        const enrollBtn = card.querySelector('[data-action="enroll"]');
        const detailBtn = card.querySelector('[data-action="detail"]');

        enrollBtn?.addEventListener('click', (e) => {
            e.stopPropagation();
            const id = e.currentTarget?.dataset?.id;
            if (!id) return;
            window.location.href = `course-player.html?id=${id}`;
        });

        detailBtn?.addEventListener('click', (e) => {
            e.stopPropagation();
            const id = e.currentTarget?.dataset?.id;
            if (!id) return;
            window.location.href = `course-detail.html?id=${id}`;
        });

        // Click on card goes to course detail
        card.addEventListener('click', () => {
            window.location.href = `course-detail.html?id=${course.id}`;
        });

        return card;
    }
};