export function renderStudentIntelligenceCard(data = {}) {
    const title = data.title || 'Your Learning Pulse';
    const subtitle = data.subtitle || 'A calm view of your momentum and next best step.';
    const items = Array.isArray(data.items) ? data.items : [];
    const badge = data.badge || 'Personalized';

    return `
        <section class="student-intelligence-card" aria-label="Student intelligence overview" style="margin: 28px 0 18px; padding: 20px 22px; border-radius: 22px; background: linear-gradient(135deg, rgba(255,255,255,0.72), rgba(248,244,255,0.82)); border: 1px solid rgba(139,0,255,0.16); box-shadow: 0 18px 42px rgba(139,0,255,0.1);">
            <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:12px; flex-wrap:wrap; margin-bottom: 12px;">
                <div>
                    <div style="font-size: 0.75rem; font-weight:700; letter-spacing: 0.2em; text-transform: uppercase; color: #8B00FF; margin-bottom: 4px;">${badge}</div>
                    <h3 style="font-size: 1.12rem; font-weight: 700; color: #1E1029; margin:0;">${title}</h3>
                    <p style="margin: 4px 0 0; color: #5F4C73; font-size: 0.95rem;">${subtitle}</p>
                </div>
                <div style="padding: 8px 12px; border-radius: 999px; background: rgba(255,215,0,0.16); color: #8B00FF; font-size: 0.82rem; font-weight:700;">AI-guided</div>
            </div>
            <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 10px;">
                ${items.map((item) => `
                    <div style="padding: 12px 13px; border-radius: 16px; background: rgba(255,255,255,0.66); border: 1px solid rgba(139,0,255,0.1);">
                        <div style="font-size:0.78rem; font-weight:700; letter-spacing: 0.08em; text-transform: uppercase; color:#7A6A8A; margin-bottom: 5px;">${item.label}</div>
                        <div style="font-size:0.95rem; font-weight:700; color:#1E1029;">${item.value}</div>
                    </div>
                `).join('')}
            </div>
        </section>
    `;
}

export default { renderStudentIntelligenceCard };
