# Sword Institute Knowledge Hub
## Comprehensive Implementation Plan

**Date**: 2026-07-13  
**Status**: Architecture & Planning Phase  
**Scope**: Knowledge Hub as central platform service across LMS

---

## 1. EXECUTIVE SUMMARY

The **Sword Knowledge Hub** is a searchable digital resource center that will become the central knowledge service for the LMS. It connects:
- **Academies** → curated resource collections per Academy
- **Courses** → related resources per course
- **Dashboard** → personalized reading experience
- **Students** → favorites, reading history, recommendations
- **Professor SWORD** → AI-powered discovery, summarization, Q&A
- **Learning Collections** → curated course + resource bundles
- **Reading Paths** → guided learning journeys with completion tracking
- **Career Portfolio** → learning achievements and skills

This is **NOT a redesign** of the LMS. It is a **new platform service layer** that enhances existing experiences through modular service APIs and lightweight UI components.

---

## 2. CURRENT ARCHITECTURE ASSESSMENT

### Strengths
✅ **Firebase Foundation**: Auth, Firestore, Storage, Cloud Functions ready  
✅ **Service Layer Pattern**: courseService, mentorService, enrollmentService established  
✅ **Caching Strategy**: CourseService demonstrates 5-min cache pattern  
✅ **AI Layer**: aiOrchestrator.js ready for integration  
✅ **Glass Design**: Preserved across all pages  
✅ **Modular Services**: 20+ service files available  

### Gaps
⚠ **No Resource Service**: Knowledge Hub resources need dedicated service  
⚠ **Empty Placeholders**: bookmarkService, progressService, studentService empty  
⚠ **No Reading Tracking**: Progress tracking for knowledge resources  
⚠ **No Recommendations**: Personalization engine needed  
⚠ **Limited Dashboard**: No "Continue Reading" or reading goals  
⚠ **No Learning Collections**: Bundled course + resource offerings  

### Reusable Services
| Service | Status | Reusable | Notes |
|---------|--------|----------|-------|
| courseService.js | ✅ Mature | High | Demonstrates caching, normalization pattern |
| aiOrchestrator.js | ✅ Established | High | Routes AI requests to specialized services |
| enrollmentService.js | ✅ Mature | High | Can adapt for resource saves/likes |
| progressService.js | ⚠ Empty | High | Foundation ready for reading progress |
| bookmarkService.js | ⚠ Empty | High | Foundation ready for favorites |
| mentorService.js | ✅ Mature | High | Can integrate resource recommendations |

---

## 3. FIRESTORE SCHEMA EXTENSIONS

### New Collections Required

#### A. `knowledge_resources`
Central collection for all discoverable resources.

```firestore
knowledge_resources/{resourceId}
├── title: string
├── description: string (long-form, 500 chars)
├── shortDescription: string (140 chars, teaser)
├── type: enum [book, paper, video, podcast, article, template, toolkit, case-study, download, policy, external, ai-resource]
├── thumbnailURL: string (Cloud Storage path)
├── contentURL: string (Cloud Storage or external link)
├── author: string
├── publishedDate: timestamp
├── updatedDate: timestamp
├── academy: reference → academies/{academyId}
├── relatedCourses: array<reference>
├── difficulty: enum [beginner, intermediate, advanced]
├── estimatedTime: number (minutes)
├── format: string (pdf, video, audio, article, interactive)
├── language: string
├── tags: array<string> (searchable keywords)
├── rating: number (1-5, average)
├── ratingCount: number
├── views: number
├── downloads: number
├── saves: number
├── shares: number
├── isPublished: boolean
├── isSponsored: boolean
├── createdAt: timestamp
├── metadata: map
│   ├── wordCount: number
│   ├── videoLength: number
│   ├── fileSize: string
│   └── prerequisites: array<string>
```

**Indexes**: academy, type, difficulty, tags, isPublished, createdAt, rating  
**Security**: Public read (published), admin/instructor write

---

#### B. `reading_progress`
Track reading activity per student.

```firestore
reading_progress/{studentId}/{resourceId}
├── studentId: reference → students/{studentId}
├── resourceId: reference → knowledge_resources/{resourceId}
├── status: enum [not-started, in-progress, completed]
├── progress: number (0-100%)
├── currentPage: number (for PDFs)
├── notesCount: number
├── highlightCount: number
├── isSaved: boolean
├── isLiked: boolean
├── lastAccessedAt: timestamp
├── completedAt: timestamp (null if not completed)
├── timeSpent: number (seconds)
├── createdAt: timestamp
```

**Indexes**: studentId, status, lastAccessedAt, completedAt  
**Security**: Student reads/writes only own data

---

#### C. `reading_notes`
Learner notes and highlights on resources.

```firestore
reading_notes/{studentId}/{noteId}
├── studentId: reference → students/{studentId}
├── resourceId: reference → knowledge_resources/{resourceId}
├── type: enum [note, highlight, question]
├── content: string (note text)
├── context: string (surrounding text for highlights)
├── pageNumber: number
├── colorTag: string (highlight color: yellow, blue, green, red)
├── isFlagged: boolean (for questions needing response)
├── createdAt: timestamp
├── updatedAt: timestamp
```

**Indexes**: studentId, resourceId, createdAt

---

#### D. `learning_collections`
Curated bundles of courses + resources.

```firestore
learning_collections/{collectionId}
├── title: string
├── slug: string
├── description: string
├── thumbnailURL: string
├── academy: reference → academies/{academyId}
├── courses: array<reference → courses/{courseId}>
├── resources: array<reference → knowledge_resources/{resourceId}>
├── relatedCollections: array<reference>
├── difficulty: string [beginner, intermediate, advanced]
├── estimatedDuration: number (weeks/hours)
├── completionCertificate: string (certificate template ID)
├── objectives: array<string>
├── isPublished: boolean
├── createdAt: timestamp
│  updatedAt: timestamp
```

---

#### E. `reading_paths`
Guided learning journeys with milestones.

```firestore
reading_paths/{pathId}
├── title: string
├── description: string
├── academy: reference → academies/{academyId}
├── sections: array<map>
│   ├── title: string (e.g., "Foundations")
│   ├── description: string
│   ├── lessons: array<reference → lessons/{lessonId}>
│   ├── resources: array<reference → knowledge_resources/{resourceId}>
│   ├── quizzes: array<reference → quizzes/{quizId}>
│   └── order: number
├── completionCertificate: string
├── difficulty: enum [beginner, intermediate, advanced]
├── estimatedWeeks: number
├── learningOutcomes: array<string>
├── isPublished: boolean
├── createdAt: timestamp
```

---

#### F. `resource_recommendations`
Pre-computed personalized recommendations (or generated on-demand).

```firestore
resource_recommendations/{studentId}/{recommendationId}
├── studentId: reference → students/{studentId}
├── resource: reference → knowledge_resources/{resourceId}
├── reason: enum [based-on-course, based-on-history, trending, academy-suggested, skill-gap, prerequisite]
├── relevanceScore: number (0-100)
├── priority: enum [high, medium, low]
├── createdAt: timestamp
├── expiresAt: timestamp (recommendation TTL)
```

---

#### G. `career_portfolios`
Aggregated learning achievements.

```firestore
career_portfolios/{studentId}
├── studentId: reference → students/{studentId}
├── certificates: array<reference → certificates/{certId}>
├── completedCourses: array<reference → courses/{courseId}>
├── readingAchievements: map
│   ├── totalResourcesCompleted: number
│   ├── totalTimeSpent: number (minutes)
│   ├── currentStreak: number (days)
│   ├── longestStreak: number (days)
│   └── badges: array<string>
├── projects: array<reference → projects/{projectId}>
├── skills: array<map>
│   ├── skillName: string
│   ├── level: enum [beginner, intermediate, advanced]
│   └── verifiedAt: timestamp
├── totalXP: number
├── badgeCount: number
├── updatedAt: timestamp
```

---

### Existing Collections to Extend

#### A. `students` document
Add fields:

```firestore
students/{studentId}
├── ... (existing fields)
├── readingGoal: number (pages/minutes per week)
├── readingStreak: number (consecutive days)
├── preferredTopics: array<string>
├── readingLevel: enum [beginner, intermediate, advanced]
├── lastReadAt: timestamp
├── totalResourcesCompleted: number
├── savedResourcesCount: number
```

#### B. `courses` document
Add fields:

```firestore
courses/{courseId}
├── ... (existing fields)
├── relatedResources: array<reference → knowledge_resources/{resourceId}>
├── suggestedReadingOrder: array<reference> (ordered resource IDs)
├── downloadableAssets: array<object>
│   ├── name: string
│   ├── url: string
│   └── type: string
```

#### C. `academies` document (if stored in Firestore)
Add fields:

```firestore
academies/{academyId}
├── ... (existing fields)
├── featuredResources: array<reference>
├── toolkits: array<reference>
├── recommendedBooks: array<reference>
├── readingPaths: array<reference>
```

---

## 4. SERVICE LAYER IMPLEMENTATION

### Services to Create (New)

| Service | Purpose | Key Methods |
|---------|---------|-------------|
| **resourceService.js** | Core resource CRUD and discovery | loadResources, searchResources, getResourceById, getRatedResources, getPopularResources, getResourcesByAcademy, getResourcesByType, getResourcesByDifficulty |
| **readingProgressService.js** | Track reading activity | updateProgress, getProgress, markCompleted, getReadingHistory, getReadingStreak, getReadingStats |
| **bookmarkService.js** | Save & favorite resources | saveResource, unsaveResource, getSavedResources, likeResource, unlikeResource, getLikedResources |
| **recommendationService.js** | Personalized recommendations | generateRecommendations, getRecommendationsForStudent, getRecommendationsBasedOnCourse, getRecommendationsBasedOnHistory, cacheRecommendations |
| **learningCollectionService.js** | Manage learning collections | getCollections, getCollectionById, getCollectionProgress, enrollInCollection, trackCollectionProgress |
| **readingPathService.js** | Manage reading paths | getReadingPaths, getReadingPathById, getPathProgress, updatePathProgress, generateReadingCertificate |
| **careerPortfolioService.js** | Build & display portfolios | getPortfolio, updatePortfolio, addCertificate, addSkill, getBadges, generatePortfolioSummary |

### Services to Extend (Existing)

| Service | Extensions | New Methods |
|---------|-----------|------------|
| **aiOrchestrator.js** | Resource search & AI | addSearchResources, summarizeResource, explainConcept, generateQuizzes, generateFlashcards, recommendResources |
| **progressService.js** | Reading progress tracking | trackResourceProgress, getResourceCompletion, getLearningStats |
| **bookmarkService.js** | Resource saves/favorites | saveResource, getSavedResources, likeResource, getLikedResources |
| **dashboardService.js** | Reading features | getContinueReading, getRecommendedResources, getReadingGoals, getReadingStats |

---

## 5. UI COMPONENTS & PAGES

### New Pages to Create

| Page | Route | Purpose | Components |
|------|-------|---------|-----------|
| **Knowledge Hub** | `/knowledge-hub.html` | Resource discovery & search | SearchBar, ResourceFilters, ResourceGrid, ResourceCard, ResourceDetail |
| **My Bookshelf** | `/my-bookshelf.html` | Personalized reading hub | ContinueReading, SavedResources, ReadingHistory, PersonalRecommendations |
| **Learning Collections** | `/learning-collections.html` | Browse & enroll in collections | CollectionGrid, CollectionCard, CollectionDetail, EnrollButton |
| **Reading Paths** | `/reading-paths.html` | Guided learning journeys | PathGrid, PathCard, PathDetail, ProgressTracker |
| **Career Portfolio** | `/career-portfolio.html` | Learning achievements | CertificateGallery, SkillsList, ProjectShowcase, BadgesDisplay, XPCounter |

### Components to Create

#### Resource Discovery Components
- `ResourceSearchBar` — Type-ahead search with AI suggestions
- `ResourceFilters` — Academy, type, difficulty, duration, rating filters
- `ResourceGrid` — Responsive grid of resource cards
- `ResourceCard` — Resource thumbnail, title, metadata, actions
- `ResourceDetail` — Full resource view with notes, related resources, AI integration
- `RatingComponent` — Star ratings with count
- `TagCloud` — Filterable tag display

#### Reading Progress Components
- `ContinueReadingCarousel` — Show in progress resources
- `ReadingProgressBar` — Visual progress tracking
- `ReadingStatsWidget` — Reading time, streak, goals
- `HighlightsPanel` — View/manage highlights and notes
- `NotesPanel` — View/manage reading notes

#### AI Integration Components
- `AIProfessorWidget` — Ask SWORD about resources
- `SummaryPanel` — AI-generated summaries
- `QuizGenerator` — AI-generated practice questions
- `FlashcardPanel` — AI-generated flashcards
- `RecommendationPanel` — AI-suggested next resources

#### Personalization Components
- `ReadingGoalCard` — Set & track daily/weekly goals
- `PersonalRecommendationCarousel` — Personalized suggestions
- `LearningPathProgressTracker` — Section-by-section progress
- `AchievementBadges` — Display earned badges
- `ReadingStreak` — Consecutive reading days

### Integration Points on Existing Pages

#### Dashboard (`dashboard.html`)
- Add "Continue Reading" section at top
- Add "Recommended Resources" widget
- Add "Reading Progress" card
- Add "Reading Streak" badge

#### Course Template (`course-template.html`)
- Add "Related Resources" section
- Add "Suggested Reading" before course starts
- Add "Downloadable Assets" widget
- Add "Professor SWORD Study Notes" section

#### Academies Pages
- Add "Featured Resources" carousel
- Add "Toolkits" section
- Add "Recommended Books" section
- Add "Reading Paths" for Academy
- Link to Academy-specific resources

#### Lesson Player (`student/lesson.html`)
- Add "Related Resources" sidebar
- Add "Professor SWORD Resource Recommendations" widget
- Add "Further Reading" suggestions

---

## 6. FIRESTORE SECURITY RULES

### Knowledge Resources (Public Read)
```
match /knowledge_resources/{document=**} {
  allow read: if resource.data.isPublished == true;
  allow create, update, delete: if request.auth.token.isAdmin == true;
}
```

### Reading Progress (Authenticated, Personal)
```
match /reading_progress/{studentId}/{document=**} {
  allow read, write: if request.auth.uid == studentId || request.auth.token.isAdmin == true;
}
```

### Reading Notes (Authenticated, Personal)
```
match /reading_notes/{studentId}/{document=**} {
  allow read, write: if request.auth.uid == studentId || request.auth.token.isAdmin == true;
}
```

### Recommendations (Personal)
```
match /resource_recommendations/{studentId}/{document=**} {
  allow read: if request.auth.uid == studentId;
  allow write: if request.auth.token.isCloudFunction == true;
}
```

### Career Portfolio (Personal)
```
match /career_portfolios/{studentId} {
  allow read: if request.auth.uid == studentId || request.auth.token.isAdmin == true;
  allow write: if request.auth.token.isCloudFunction == true;
}
```

---

## 7. CLOUD FUNCTIONS REQUIREMENTS

### Functions to Create/Extend

| Function | Trigger | Purpose |
|----------|---------|---------|
| **generateResourceRecommendations** | On student reading progress | Generate personalized recommendations based on reading history |
| **updateReadingStats** | On reading progress change | Update career portfolio reading achievements |
| **summarizeResource** | On-demand HTTP | Generate AI summaries of documents |
| **generateQuizFromResource** | On-demand HTTP | Create practice questions from resource |
| **generateFlashcards** | On-demand HTTP | Create study flashcards from resource |
| **assignResourceBadges** | On student milestone | Award badges for reading achievements |
| **generateReadingPathCertificate** | On path completion | Create completion certificate |
| **updateAcademyResources** | Admin trigger | Sync resources to Academy collections |

---

## 8. PROFESSOR SWORD INTEGRATION

### AI Capabilities for Knowledge Hub

1. **Search Resources** — Natural language search of entire Knowledge Hub
2. **Summarize Documents** — Extract key points from PDFs, articles, papers
3. **Explain Concepts** — Answer questions about resource content
4. **Generate Quizzes** — Create practice questions from resources
5. **Create Flashcards** — Study aids from resource content
6. **Recommend Resources** — Suggest next resources based on learning path
7. **Suggest Next Courses** — Recommend courses after resource completion
8. **Create Reading Plans** — Personalized reading journey for learning goal

### Integration Points
- Knowledge Hub search bar → AI-enhanced search
- Resource detail page → "Ask Professor SWORD" button
- Reading path → "Generate Study Guide" via SWORD
- Dashboard → "What should I read next?" widget
- Lessons → "Find related resources" → SWORD suggestions

---

## 9. IMPLEMENTATION SEQUENCE

### Phase 1: Foundation (Week 1)
1. ✅ Create Firestore schema (collections + security rules)
2. Create resourceService.js (basic CRUD, caching)
3. Create readingProgressService.js
4. Create bookmarkService.js
5. Seed initial resources to Firestore (sample data)

### Phase 2: Discovery (Week 2)
6. Create Knowledge Hub page with search, filters, grid
7. Create ResourceCard and ResourceDetail components
8. Integrate resourceService with UI
9. Add resource search to aiOrchestrator.js
10. Create resource API endpoints

### Phase 3: Personalization (Week 3)
11. Create recommendationService.js
12. Create readingProgressService.js (full implementation)
13. Create My Bookshelf page
14. Create Dashboard reading widgets
15. Implement Continue Reading functionality

### Phase 4: Learning Paths (Week 4)
16. Create readingPathService.js
17. Create Reading Paths page
18. Create LearningCollectionService.js
19. Create Learning Collections page
20. Implement progress tracking

### Phase 5: AI Integration (Week 5)
21. Extend aiOrchestrator with resource AI capabilities
22. Create AI components (Summary, Quiz, Flashcards)
23. Implement Professor SWORD resource integration
24. Create Cloud Functions for AI operations

### Phase 6: Integration (Week 6)
25. Extend Dashboard with reading features
26. Extend Course Template with related resources
27. Extend Academies with resource collections
28. Extend Lesson Player with resource recommendations

### Phase 7: Portfolio & Polish (Week 7)
29. Create careerPortfolioService.js
30. Create Career Portfolio page
31. Badge/achievement system
32. Final testing, accessibility, performance

---

## 10. FILE STRUCTURE (What Will Be Created)

```
js/
├── services/
│   ├── resourceService.js ✅ NEW
│   ├── readingProgressService.js ✅ NEW (refactor from empty)
│   ├── bookmarkService.js ✅ NEW (refactor from empty)
│   ├── recommendationService.js ✅ NEW
│   ├── learningCollectionService.js ✅ NEW
│   ├── readingPathService.js ✅ NEW
│   ├── careerPortfolioService.js ✅ NEW
│   └── aiOrchestrator.js ⚡ EXTEND
├── components/
│   ├── resourceSearch/ (NEW FOLDER)
│   │   ├── SearchBar.js
│   │   ├── FilterPanel.js
│   │   ├── ResourceGrid.js
│   │   └── ResourceCard.js
│   ├── reading/ (NEW FOLDER)
│   │   ├── ContinueReading.js
│   │   ├── ReadingStats.js
│   │   ├── HighlightsPanel.js
│   │   └── NotesPanel.js
│   ├── ai/ (NEW FOLDER - extends existing)
│   │   ├── ResourceSummary.js
│   │   ├── QuizGenerator.js
│   │   ├── FlashcardPanel.js
│   │   └── AIProfessorWidget.js
│   └── portfolio/ (NEW FOLDER)
│       ├── CertificateGallery.js
│       ├── SkillsList.js
│       └── BadgesDisplay.js

pages/
├── knowledge-hub.html ✅ NEW
├── my-bookshelf.html ✅ NEW
├── learning-collections.html ✅ NEW
├── reading-paths.html ✅ NEW
└── career-portfolio.html ✅ NEW

css/
├── knowledge-hub.css ✅ NEW
├── reading.css ✅ NEW
├── portfolio.css ✅ NEW
└── (extend existing academies.css, dashboard.css)

docs/
├── KNOWLEDGE-HUB-SCHEMA.md ✅ NEW (this file extended)
├── KNOWLEDGE-HUB-API.md ✅ NEW (API docs)
└── KNOWLEDGE-HUB-IMPLEMENTATION.md ✅ NEW (detailed implementation guide)

functions/
├── functions/resources.js ✅ NEW (Cloud Functions for resources)
├── functions/recommendations.js ✅ NEW (recommendation generation)
└── functions/aiServices.js ✅ NEW (AI/SWORD integration)
```

---

## 11. IMPLEMENTATION RULES

### Must-Have Rules
1. ✅ **Preserve Glass Design** — All new UI uses existing color palette, glassmorphism effects
2. ✅ **Maintain Backward Compatibility** — No breaking changes to existing pages
3. ✅ **Use Service Layer** — All data access through services, never direct Firestore queries from UI
4. ✅ **Cache Strategy** — Implement 5-minute caches like courseService
5. ✅ **Lazy Load** — Components and resources load on-demand
6. ✅ **Responsive Design** — Mobile-first, tested on mobile, tablet, desktop
7. ✅ **Accessibility** — WCAG 2.2 AA, ARIA labels, keyboard navigation
8. ✅ **Error Handling** — Graceful fallbacks, user-friendly error messages
9. ✅ **No Console Errors** — All code production-ready
10. ✅ **Modular Code** — Reusable, well-documented, ES6 modules

### Performance Targets
- Initial page load: < 2 seconds (resources page)
- Search response: < 500ms
- Resource detail: < 1 second
- Dashboard widgets: < 800ms
- No layout shift on resource cards

---

## 12. VALIDATION CHECKLIST

### Architecture
- [ ] Knowledge Hub works as shared service (not standalone page)
- [ ] All data flows through service layer
- [ ] Backward compatibility maintained (no breaking changes)
- [ ] No duplicate Firestore reads
- [ ] Caching strategy implemented

### Functionality
- [ ] Resources load from Firestore dynamically
- [ ] Search filters work (academy, type, difficulty, rating, tags)
- [ ] Continue Reading syncs across devices
- [ ] My Bookshelf shows saved/liked resources
- [ ] Reading progress tracked accurately
- [ ] Recommendations generated correctly
- [ ] Learning Collections display and track progress
- [ ] Reading Paths have milestone tracking
- [ ] Career Portfolio aggregates achievements

### Professor SWORD Integration
- [ ] Search resources via natural language
- [ ] Summarize documents
- [ ] Explain concepts
- [ ] Generate quizzes
- [ ] Generate flashcards
- [ ] Recommend resources
- [ ] Suggest next courses
- [ ] No duplication of AI calls

### Page Integrations
- [ ] Dashboard shows Continue Reading, recommendations, reading stats
- [ ] Course template displays related resources
- [ ] Academy pages show featured resources, toolkits, reading paths
- [ ] Lesson player shows related resources

### Quality
- [ ] No JavaScript errors
- [ ] No Firebase errors
- [ ] No console warnings
- [ ] WCAG 2.2 AA compliance
- [ ] Responsive on mobile, tablet, desktop
- [ ] Performance metrics met
- [ ] Skeleton loaders appear during loading
- [ ] Error states graceful

---

## 13. NEXT STEPS

1. ✅ **Step 1** (Current): Review and approve this plan
2. **Step 2**: Create Firestore schema and security rules
3. **Step 3**: Implement resourceService.js (foundation)
4. **Step 4**: Create Knowledge Hub page with search
5. **Step 5**: Implement personalization services
6. Continue through implementation sequence

---

**Status**: Ready for approval and Phase 1 implementation

