# Platform Services Reference

## Core services

- authService.js: authentication and session tracking
- userService.js: user profile orchestration
- profileService.js: profile persistence and normalization
- courseService.js: course catalog and cache-backed reads
- knowledgeHubService.js: knowledge resource access
- recommendationService.js: personalized recommendations
- timelineService.js: learner activity timeline
- analyticsService.js: analytics snapshot and event tracking
- notificationService.js: centralized notifications and unread state
- searchService.js: fuzzy search over courses, knowledge, navigation, settings, and more
- settingsService.js: persisted platform preferences
- themeService.js: instant theme switching
- storageService.js: namespaced local storage helpers
- cacheService.js: TTL-backed caching for repeated reads
- loggingService.js: activity logging
- syncService.js: offline synchronization hooks
- permissionService.js: role-based access helpers
- apiService.js: unified gateway for AI/provider requests
- errorService.js: centralized friendly error handling
