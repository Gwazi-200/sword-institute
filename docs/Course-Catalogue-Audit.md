# Course Catalogue Discovery Audit

## Current state

The course catalogue page already contains multiple sections for courses, continue learning, recommended content, stats, and a modal. The main issue is that these sections are still presented as a general course list rather than as a guided learning discovery experience.

## Main opportunities

1. Repetitive UI sections
   - The page currently has several content blocks that are visually similar and could be reorganized into clearer discovery sections.

2. Empty or weak guest experience
   - Guests see a static catalogue experience with no onboarding or guided path for choosing a first course.

3. Limited personalization
   - The page does not yet adapt meaningfully for signed-in learners.

4. Search and filtering are not yet framed as an intelligent discovery tool.

5. Course data can be reused more effectively
   - The existing course service already caches course data, so this page should build on that rather than create duplicate data requests.

## Refactor direction

The course catalogue should evolve into a discovery experience with:

- a dynamic guest/auth-based hero,
- a compact Professor SWORD recommendation widget,
- reusable discovery sections,
- richer course cards,
- cached search/filter behaviour,
- progressive rendering and loading states.

This can be introduced incrementally while preserving the existing page structure.
