# TODO - Professor SWORD Homepage AI Concierge Redesign

- [x] Understand current homepage AI assistant markup + JS hooks in `index.html` and related modules.
- [x] Create a plan for compact Apple-style glassmorphism UI and remove large panel sections (teaching modes, quick actions, big messages).
- [x] Refactor `index.html` AI assistant markup to: compact header + single welcome message + glass input + 4 suggestion chips.
- [ ] Add/adjust CSS (component-based, no inline): glass styles, max width 420px, theme via CSS variables, responsive.
- [x] Implement lightweight JS for suggestion chips insertion and message sending (do not auto-send).
- [x] Ensure existing full teaching interface inside student dashboard/lesson player remains unaffected (only homepage).
- [ ] Verify accessibility: semantic labels, ARIA where needed, keyboard support.
- [ ] Smoke test in browser: load page, chips insert prompt, Enter sends, glass UI renders.


