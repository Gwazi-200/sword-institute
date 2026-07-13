export function createStudentTable(container, students = []) {
    if (!container) {
        return null;
    }

    container.innerHTML = `
        <section class="glass-card" aria-label="Student manager">
            <h2>Student Manager</h2>
            <table>
                <thead>
                    <tr>
                        <th scope="col">Student</th>
                        <th scope="col">Progress</th>
                        <th scope="col">Attendance</th>
                    </tr>
                </thead>
                <tbody>
                    ${students.length ? students.map((student) => `
                        <tr>
                            <td>${student.fullName || student.name || 'Student'}</td>
                            <td>${student.currentCourses?.length || 0} active courses</td>
                            <td>${student.attendance || 'Tracked'}</td>
                        </tr>
                    `).join('') : '<tr><td colspan="3">No student data yet.</td></tr>'}
                </tbody>
            </table>
        </section>
    `;

    return { container };
}

export default createStudentTable;
