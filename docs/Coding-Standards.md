# Coding Standards

## Purpose
These standards define how the Sword Institute codebase should be written, organized, reviewed, and maintained. They are intended for a professional software team working on a scalable, accessible, and production-ready learning platform.

## 1. Core Engineering Principles
- Use ES Modules for all JavaScript logic.
- Follow a modular architecture with clear separation of responsibilities.
- Keep each file focused on one responsibility.
- Avoid duplication by extracting shared behavior into reusable modules.
- Use async/await for asynchronous operations such as Firebase calls and network requests.
- Write code that is readable, testable, and maintainable.
- Favor clarity over cleverness.

## 2. Architecture Rules

### 2.1 ES Modules
- All JavaScript files that expose reusable logic must use ES Modules.
- Use import and export syntax consistently.
- Do not rely on global variables for shared application logic.
- Keep module dependencies explicit and minimal.

### 2.2 One Responsibility Per File
- Each file must have a single, well-defined purpose.
- Do not mix authentication logic, DOM rendering, and Firebase access in one file.
- If a file grows too large, split it into smaller modules.

### 2.3 No Duplicate Firebase Initialization
- Firebase must be initialized only once.
- Shared Firebase services should be exported from a central configuration module.
- Do not create multiple Firebase app instances or repeated initialization code across pages.

### 2.4 No Inline JavaScript
- Do not place JavaScript directly inside HTML attributes or inline event handlers.
- All behavior should be implemented in dedicated JavaScript modules.

### 2.5 No Inline CSS
- Do not embed CSS inside HTML elements or style attributes.
- All styling must live in dedicated stylesheet files.

## 3. Code Quality Standards

### 3.1 Comments
- Use professional, concise comments that explain intent, not obvious behavior.
- Add comments for non-trivial logic, complex workflows, and integration points.
- Avoid redundant or noisy comments.

### 3.2 Error Handling
- Handle errors gracefully and predictably.
- Use try/catch where asynchronous logic may fail.
- Surface clear and user-friendly error messages.
- Avoid swallowing errors silently.

### 3.3 Async/Await
- Use async/await for all asynchronous operations, including Firebase calls and Promise-based logic.
- Avoid deeply nested Promise chains where async/await is clearer.

### 3.4 Modular Architecture
- Separate presentation, business logic, validation, utilities, and service integration into distinct modules.
- Keep page-specific code in page controllers and shared logic in reusable modules.
- Favor dependency injection and explicit function interfaces where practical.

## 4. Accessibility Requirements
Accessibility is mandatory for all user interfaces.

- Use semantic HTML elements such as header, main, nav, section, footer, button, and form.
- Ensure all interactive elements can be reached with keyboard navigation.
- Provide meaningful labels for form fields and buttons.
- Use ARIA attributes only where they add meaningful accessibility value.
- Maintain visible focus states for keyboard users.
- Ensure color contrast meets professional usability standards.
- Support screen readers through descriptive text, labels, and landmark structure.
- Design all workflows so they are usable without relying on a mouse.

## 5. Responsive Design Requirements
All pages and UI components must be responsive.

- Layouts must adapt to mobile, tablet, and desktop screen sizes.
- Use flexible layouts and responsive CSS rules.
- Avoid fixed-width structures that break on smaller devices.
- Ensure forms, buttons, navigation, and cards remain usable at all breakpoints.
- Test interfaces in multiple viewport sizes during development.

## 6. Naming Conventions
Consistent naming improves readability and maintainability.

### 6.1 Files
- Use lowercase names with hyphens for multi-word files when appropriate.
- Use descriptive names that reflect purpose.
- Examples:
  - auth.js
  - dashboard.js
  - validation.js
  - firebase-config.js

### 6.2 Variables and Functions
- Use camelCase for variables and function names.
- Use descriptive names that reflect purpose.
- Prefer meaningful names over abbreviations.
- Examples:
  - loginUser
  - saveStudentProfile
  - renderDashboard

### 6.3 Constants
- Use UPPER_SNAKE_CASE for constants.
- Examples:
  - MAX_RETRY_COUNT
  - DEFAULT_ROLE

### 6.4 CSS Classes
- Use lowercase kebab-case for CSS class names.
- Use names that describe structure or purpose.
- Examples:
  - auth-card
  - dashboard-stats
  - mentor-panel

## 7. Folder Organization
The repository should remain organized and predictable.

### Recommended structure
- root HTML entry pages such as index.html, login.html, register.html, dashboard.html, and courses.html
- css/ for all stylesheet files
- js/ for JavaScript modules and page logic
- docs/ for product and technical documentation
- assets/ for shared images, icons, or static resources

### Module placement guidance
- Authentication and session management belong in js/auth.js
- Firebase configuration belongs in js/firebase-config.js
- Firestore access helpers belong in js/firestore.js
- Validation rules belong in js/validation.js
- UI behavior and shared feedback belong in js/ui.js
- Page-specific logic should remain in dedicated page modules such as login.js, register.js, dashboard.js, and courses.js

## 8. Styling Guidelines
- Use external CSS files only.
- Keep styles grouped by feature or page area.
- Prefer reusable classes over one-off styles.
- Maintain a consistent visual language across the product.
- Use clear spacing, typography, and component structure.

## 9. HTML Guidelines
- Use semantic and accessible HTML structure.
- Keep markup clean and easy to maintain.
- Avoid unnecessary nesting and overly complex structures.
- Use form labels and input associations correctly.
- Ensure pages remain functional without JavaScript where reasonable.

## 10. Review and Collaboration Expectations
- All code should be reviewed before being merged.
- Changes should be small, intentional, and easy to understand.
- Pull requests should explain what changed and why.
- New features should be documented where appropriate.
- Maintain consistency with existing patterns unless a justified refactor is needed.

## 11. Recommended Team Practices
- Keep modules focused and reusable.
- Refactor duplicated logic into shared helpers.
- Prefer clear abstractions over ad hoc solutions.
- Maintain documentation alongside code changes.
- Test critical flows such as login, registration, dashboard access, and course interactions in the browser.
