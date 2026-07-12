# Professor SWORD AI Architecture Report

## Current State

The existing LMS already has a visible Professor SWORD experience, but the AI implementation is distributed across multiple entry points:

- Root-level AI scripts such as aiService.js and ai-service.js
- Firebase Cloud Functions in functions/index.js
- Inline browser logic in index.html, dashboard.html, course-template.html, and student/lesson.html
- UI helpers in js/ai/promptTemplates.js, quickActions.js, teachingModes.js, and professorSword.js

This makes the experience functional, but it is not yet a true intelligence layer. The current approach mixes UI behaviour, provider integration, and fallback handling in a way that makes the system harder to scale, secure, and maintain.

## Architectural Gaps

1. No central AI orchestration layer
   - Requests are handled in multiple places instead of through one modular service gateway.

2. No clear separation between specialized AI services
   - Coaching, assessment, study planning, recommendation, and gamification are not yet isolated services.

3. Browser-side AI logic is too coupled
   - The frontend should not call providers directly; it should route through secure Firebase Functions.

4. No reusable fallback strategy
   - When AI services are unavailable, the learner should still receive a helpful response.

5. No request deduplication or response caching
   - Repeated prompts could trigger duplicate work and unnecessary backend traffic.

## Proposed Modular Direction

The next evolution is to treat Professor SWORD as a unified experience backed by multiple specialized services:

- Learning Coach
- Assessment Engine
- Revision Coach
- Study Planner
- Recommendation Engine
- Gamification Engine
- Analytics Engine

The frontend should interact with a single orchestrator that:

- routes requests to the correct domain service,
- forwards secure requests through Firebase callable functions,
- provides graceful fallback responses,
- caches repeated responses briefly,
- preserves the existing learner-facing experience.

## Initial Implementation Delivered

A new modular AI orchestration module is now introduced at:

- js/ai/aiOrchestrator.js

It provides:

- a central request entry point,
- service routing based on intent,
- secure callable-function integration through Firebase,
- graceful fallback responses,
- lightweight caching and duplicate-request protection.

This is the first step toward a production-ready AI architecture without breaking the current experience.
