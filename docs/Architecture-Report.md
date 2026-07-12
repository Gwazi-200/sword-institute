# Sword Institute Architecture Report

## Current architecture

The LMS already has a solid foundation built around:

- Firebase Authentication, Firestore, Storage, and Cloud Functions
- A preserved Apple-inspired glass UI
- Existing pages for the homepage, dashboard, courses, lessons, profile, and admin areas

The main issue is that the codebase currently mixes UI behavior, business logic, and Firebase access across many page-level scripts. This is functional, but it makes reuse and scaling harder.

## Architectural opportunity

To support future growth, the project should evolve around two layers:

1. Experience Layer
   - Reusable UI components such as identity hubs, theme controls, navigation, notifications, cards, empty states, toasts, and modal primitives.

2. Service Layer
   - Reusable services for authentication, user data, courses, progress, analytics, notifications, search, recommendations, certificates, gamification, AI orchestration, and theme state.

## Initial implementation scope

This first phase introduces:

- a reusable theme service,
- a reusable auth service,
- a reusable notification service,
- a reusable identity hub experience component,
- a reusable Professor SWORD widget component,
- a small architecture bridge that allows the existing pages to use these modules without breaking current behavior.

These additions preserve routing, Firebase integration, and the current UI style while making the project easier to extend.
