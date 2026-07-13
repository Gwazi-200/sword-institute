import { createCourseBuilder } from './components/CourseBuilder.js';
import { createAssessmentBuilder } from './components/AssessmentBuilder.js';
import { createAnalyticsDashboard } from './components/AnalyticsDashboard.js';
import { createStudentTable } from './components/StudentTable.js';
import { createPlannerCalendar } from './components/PlannerCalendar.js';
import { createCertificateDesigner } from './components/CertificateDesigner.js';
import { createAnnouncementComposer } from './components/AnnouncementComposer.js';
import { getInstructorOverview, createCourseDraft, publishCourse, saveKnowledgeResource } from './services/instructorService.js';
import { createAssessment, createQuestionBankEntry } from './services/assessmentService.js';
import { getPlannerItems, addPlannerItem } from './services/plannerService.js';
import { getCertificateTemplates, saveCertificateTemplate, issueCertificate, revokeCertificate } from './services/certificateManagerService.js';
import { getAnnouncements, postAnnouncement, sendBroadcast } from './services/communicationService.js';
import { getCurrentUser } from './services/authService.js';

export async function initInstructorStudio(container) {
    if (!container) {
        return null;
    }

    const user = getCurrentUser();
    const overview = await getInstructorOverview(user?.uid || null);

    container.innerHTML = `
        <main class="instructor-studio" aria-label="Instructor Studio">
            <section class="glass-card" aria-label="Studio overview">
                <h1>Instructor Studio</h1>
                <p>Academic command center for course delivery, assessments, student management, and communications.</p>
            </section>
            <div class="studio-grid">
                <div data-course-builder></div>
                <div data-assessment-builder></div>
                <div data-analytics></div>
                <div data-students></div>
                <div data-planner></div>
                <div data-certificates></div>
                <div data-announcements></div>
            </div>
        </main>
    `;

    createCourseBuilder(container.querySelector('[data-course-builder]'));
    createAssessmentBuilder(container.querySelector('[data-assessment-builder]'));
    createAnalyticsDashboard(container.querySelector('[data-analytics]'), {
        activeLearners: overview.activeLearners,
        completionRate: overview.completionRate,
        knowledgeHubUse: overview.courses.length,
        professorUse: overview.students.length,
    });
    createStudentTable(container.querySelector('[data-students]'), overview.students);
    createPlannerCalendar(container.querySelector('[data-planner]'), getPlannerItems());
    createCertificateDesigner(container.querySelector('[data-certificates]'));
    createAnnouncementComposer(container.querySelector('[data-announcements]'));

    container.addEventListener('studio:course-created', async (event) => {
        const created = await createCourseDraft(event.detail);
        await publishCourse(created.id, { status: 'draft' });
        await saveKnowledgeResource({ title: created.title, type: 'course' });
    });

    container.addEventListener('studio:assessment-created', async (event) => {
        await createAssessment({ ...event.detail, questions: [] });
        await createQuestionBankEntry({ title: event.detail.title, type: event.detail.type });
    });

    container.addEventListener('studio:certificate-created', async (event) => {
        await saveCertificateTemplate(event.detail);
        await issueCertificate(event.detail);
    });

    container.addEventListener('studio:announcement-created', async (event) => {
        await postAnnouncement(event.detail);
        await sendBroadcast(event.detail);
    });

    return { container, overview };
}

export default initInstructorStudio;
