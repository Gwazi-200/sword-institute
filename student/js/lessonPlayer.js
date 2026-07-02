// student/js/lessonPlayer.js
// Minimal, safe lesson player script to wire basic UI without assuming Firestore schema.

console.log('🚀 Student Lesson Player Loaded');

function $(sel) {
  return document.querySelector(sel);
}

function onReady(fn) {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', fn, { once: true });
  } else {
    fn();
  }
}

onReady(() => {
  const sidebar = $('#lessonSidebar');
  const lessonContent = $('#lessonContent');

  // Basic sidebar active-state handling: click an <li> marks it active.
  if (sidebar) {
    sidebar.addEventListener('click', (e) => {
      const li = e.target && e.target.closest ? e.target.closest('li') : null;
      if (!li) return;
      if (li.classList.contains('locked')) return;

      sidebar.querySelectorAll('li').forEach((x) => x.classList.remove('active'));
      li.classList.add('active');

      // Placeholder: update mission briefing text if present
      const briefing = lessonContent && lessonContent.querySelector('h2');
      if (briefing) {
        briefing.textContent = li.textContent.trim();
      }
    });
  }

  // Continue buttons: scroll to sidebar or show a minimal alert.
  const continueBtn = document.querySelector('.primary-btn');
  continueBtn?.addEventListener('click', () => {
    // Avoid hard dependencies.
    const sidebarFirstActive = sidebar?.querySelector('li.active') || sidebar?.querySelector('li');
    if (sidebarFirstActive && lessonContent) {
      const target = lessonContent.querySelector('.lesson-reader');
      target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});

