# Sword Institute Architecture

## 1. Purpose
Sword Institute is an AI-powered Learning Management System designed to deliver accessible education, learner engagement, and social-impact-focused learning experiences. The platform is built as a production-ready, modular web application using HTML5, CSS3, Vanilla JavaScript ES Modules, Firebase Authentication, Firestore, Firebase Storage, and Netlify.

## 2. Architectural Overview
The application follows a layered client-side architecture that separates concerns across presentation, business logic, services, utilities, validation, and reusable UI components.

### Core Principles
- Keep the frontend lightweight and maintainable
- Use modular JavaScript with ES Modules
- Centralize Firebase access through dedicated service modules
- Separate UI rendering from logic and data access
- Support accessibility, responsiveness, and progressive enhancement
- Prepare the system for future integration with AI services and analytics

## 3. Technology Stack
- HTML5 for semantic page structure
- CSS3 for styling, layout, theming, and responsive design
- Vanilla JavaScript ES Modules for component logic and state handling
- Firebase Authentication for user registration, login, session management, and protected access
- Firestore for structured application data such as students, learning progress, and course metadata
- Firebase Storage for file uploads and media assets
- Netlify for hosting, deployment, and continuous delivery

## 4. Layered Architecture

### 4.1 Presentation Layer
The presentation layer contains all user-facing HTML pages, CSS styles, and DOM rendering logic. Its responsibility is to display interfaces and collect user input.

Responsibilities:
- Render pages such as the landing page, login page, registration page, dashboard, and course views
- Provide navigation, layouts, forms, and interactive UI states
- Maintain accessibility and responsive behavior
- Delegate actions to business logic and service modules

Major modules:
- index.html — public landing page
- login.html — authentication entry point
- register.html — account creation page
- dashboard.html — learner dashboard experience
- courses.html — course catalog and learning modules
- css/auth.css — shared visual system, layout, form styling, and responsive rules

### 4.2 Business Logic Layer
The business logic layer contains application-specific rules and workflows that coordinate UI events, validation, and service calls.

Responsibilities:
- Manage user flows such as sign-up, sign-in, logout, and profile updates
- Coordinate course browsing, learner progress updates, and dashboard rendering
- Apply rules for form submission, state transitions, and user guidance
- Keep UI code free from direct database or authentication implementation details

Major modules:
- js/auth.js — authentication workflow and session state management
- js/dashboard.js — dashboard rendering and learner activity display
- js/courses.js — course browsing and learning content interaction
- js/login.js — login form handling and login flow orchestration
- js/register.js — registration form flow and onboarding logic
- js/ui.js — shared UI behavior such as toast notifications, feedback, and interaction helpers

### 4.3 Firebase Services Layer
The Firebase services layer encapsulates all integration with Firebase products and provides a clean interface for the rest of the application.

Responsibilities:
- Manage authentication state and user identity
- Read and write Firestore documents and collections
- Upload and retrieve files from Firebase Storage
- Provide centralized error handling for Firebase operations

Major modules:
- js/firebase-config.js — Firebase initialization and export of auth, Firestore, and storage services
- js/firestore.js — Firestore CRUD helpers for student and application data
- js/storage.js — Firebase Storage helpers for media and file management

### 4.4 Utilities Layer
The utilities layer holds reusable helper functions for common tasks that are not tied to a single page or domain object.

Responsibilities:
- Format dates, strings, and numbers
- Manage local storage helpers and session persistence
- Provide safe parsing and data normalization functions
- Support reusable browser and environment checks

Major modules:
- js/utils.js — general-purpose helpers for data manipulation, formatting, storage, and browser compatibility

### 4.5 Validation Layer
The validation layer ensures user input is correct, secure, and consistent before data is submitted or processed.

Responsibilities:
- Validate form fields such as names, email addresses, passwords, and country selection
- Enforce rule-based checks for required fields and acceptable formats
- Provide user-friendly error messages and field-specific guidance
- Reduce invalid data from entering the system

Major modules:
- js/validation.js — field validation rules and reusable validators for registration, login, and profile forms

### 4.6 UI Components Layer
The UI components layer provides reusable interface building blocks that can be used across multiple pages.

Responsibilities:
- Standardize recurring UI patterns such as buttons, cards, forms, alerts, and navigation elements
- Improve development consistency across the product
- Reduce duplication and improve maintainability

Major modules:
- css/auth.css — shared component styling for cards, buttons, form inputs, navbars, and notifications
- js/ui.js — reusable UI behavior handlers for toasts, loading states, and feedback UI

## 5. Data Model Overview
The platform uses Firestore collections to organize structured data.

### Primary Collections
- students — stores learner profile and account details
- courses — stores course metadata and content references
- enrollments — maps learners to enrolled courses
- progress — stores lesson and course progress activity
- mentorSessions — stores AI or human mentor interaction records

### Storage Usage
- Profile images and uploaded learning assets are stored in Firebase Storage
- File references are stored in Firestore documents for easy retrieval

## 6. Request Flow
A typical user interaction follows this path:
1. The browser loads a page from Netlify.
2. The HTML page references CSS and JavaScript modules.
3. JavaScript initializes the page-specific controller.
4. The controller validates input or reads local state.
5. If needed, the controller calls a Firebase service module.
6. Firebase Authentication or Firestore responds with data or success/error state.
7. The UI updates accordingly and provides feedback to the user.

## 7. Security and Production Considerations
Production readiness requires the following safeguards:
- Firebase security rules must restrict access to authenticated users and authorized data
- Sensitive configuration should be stored securely and never exposed in public code paths
- Input validation must be enforced on both client and server boundaries
- Protected routes and protected UI states should be guarded by authentication checks
- Error handling should be user-friendly and non-revealing where appropriate
- All critical data operations should be tested in a real browser environment

## 8. Deployment Architecture
- Netlify hosts the static frontend assets
- Firebase provides the application’s backend services
- Static files are deployed as a single-page-friendly site with client-side routing support where needed
- The deployment pipeline should support continuous delivery from the repository

## 9. Maintainability and Future Growth
The current architecture is intentionally simple but extensible. It is well-positioned for future enhancements such as:
- AI-powered mentoring and content recommendation
- Serverless functions for advanced workflows
- Role-based access for instructors, admins, and learners
- Analytics dashboards and reporting modules
- Multi-language and multi-region content support

## 10. Recommended Implementation Guidelines
- Keep modules focused on one concern
- Use ES Modules and avoid global state where possible
- Prefer service modules over inline Firebase logic inside page scripts
- Keep UI templates and logic separated for clarity
- Continue documenting modules as the platform evolves
