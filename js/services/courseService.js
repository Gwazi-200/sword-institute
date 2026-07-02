// js/services/courseService.js – Firestore data service
import { db } from '../firebase-config.js';
import { collection, getDocs, query, where, orderBy, getDoc, doc } from 'firebase/firestore';

export const courseService = {
    async getCategories() {
        const snap = await getDocs(collection(db, 'categories'));
        const categories = [];
        snap.forEach(doc => {
            categories.push({ id: doc.id, ...doc.data() });
        });
        return categories.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
    },

    async getCourses({ page = 1, pageSize = 9, filters = {} } = {}) {
        const coursesRef = collection(db, 'courses');
        let constraints = [];
        // Only published
        constraints.push(where('published', '==', true));

        // Category filter
        if (filters.category && filters.category !== 'all') {
            constraints.push(where('category', '==', filters.category));
        }
        if (filters.level && filters.level !== 'all') {
            constraints.push(where('level', '==', filters.level));
        }
        // Features filter – we'll apply client-side since it's multiple
        // Sorting
        let sortField = 'title';
        let sortOrder = 'asc';
        switch (filters.sort) {
            case 'newest':
                sortField = 'createdAt';
                sortOrder = 'desc';
                break;
            case 'popular':
                sortField = 'students';
                sortOrder = 'desc';
                break;
            case 'rating':
                sortField = 'rating';
                sortOrder = 'desc';
                break;
            case 'duration':
                sortField = 'estimatedHours';
                sortOrder = 'asc';
                break;
            default:
                sortField = 'title';
                sortOrder = 'asc';
        }
        constraints.push(orderBy(sortField, sortOrder));

        // Pagination
        const q = query(coursesRef, ...constraints);
        const snap = await getDocs(q);
        let courses = [];
        snap.forEach(doc => {
            courses.push({ id: doc.id, ...doc.data() });
        });

        // Apply feature filters client-side
        if (filters.features && filters.features.length > 0) {
            courses = courses.filter(c => {
                let match = true;
                if (filters.features.includes('featured')) {
                    match = match && c.featured === true;
                }
                if (filters.features.includes('popular')) {
                    match = match && c.popular === true;
                }
                if (filters.features.includes('certificate')) {
                    match = match && c.certificate === true;
                }
                if (filters.features.includes('free')) {
                    match = match && c.price === 0;
                }
                return match;
            });
        }

        // Pagination client-side
        const start = (page - 1) * pageSize;
        const paginated = courses.slice(start, start + pageSize);
        const hasMore = start + pageSize < courses.length;

        return { courses: paginated, hasMore, total: courses.length };
    },

    async getCourseById(courseId) {
        const docRef = doc(db, 'courses', courseId);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
            return { id: snap.id, ...snap.data() };
        }
        return null;
    },
};