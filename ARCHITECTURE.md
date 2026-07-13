# Sword Institute Platform Architecture

## Overview

Sword Institute now uses a shared services layer as the central operating system for the platform. Pages consume services instead of implementing their own business logic.

## Service Layers

- Authentication and identity: authService.js
- Profile and user data: userService.js, profileService.js
- Learning content and catalog: courseService.js, knowledgeHubService.js
- Guidance and personalization: recommendationService.js, timelineService.js, memoryService.js
- Analytics and activity: analyticsService.js, loggingService.js
- Notifications and search: notificationService.js, searchService.js
- Settings, theme, storage, and caching: settingsService.js, themeService.js, storageService.js, cacheService.js
- API gateway and error handling: apiService.js, errorService.js

## Runtime Principles

- Use ES modules.
- Keep business logic in services.
- Reuse UI components across all pages.
- Centralize errors, logging, search, notifications, and settings.
- Cache expensive reads and queue offline writes where relevant.

## Delivery Notes

This architecture is designed to support the current experience and future expansion including mobile, voice, AI tutoring, analytics, assignments, and live classes.
