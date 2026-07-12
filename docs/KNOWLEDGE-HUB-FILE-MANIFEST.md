# Sword Knowledge Hub - Complete File Manifest

**Purpose**: Detailed breakdown of every file to be created or modified  
**Date**: 2026-07-13  
**Total Files**: 35+ files across 5 categories

---

## CATEGORY A: FIRESTORE SCHEMA & SECURITY (No Code — JSON Schema Docs)

### A1. `docs/KNOWLEDGE-HUB-SCHEMA.md`
**Status**: NEW  
**Purpose**: Complete Firestore schema with all collections, fields, indexes, security rules  
**Includes**:
- 7 new collections (knowledge_resources, reading_progress, reading_notes, learning_collections, reading_paths, resource_recommendations, career_portfolios)
- Extensions to 3 existing collections (students, courses, academies)
- Field definitions, types, indexes
- Complete Firestore security rules

**Size**: ~400 lines  
**Dependency**: None (reference document)

---

### A2. `docs/KNOWLEDGE-HUB-API.md`
**Status**: NEW  
**Purpose**: Complete API documentation for all services and Cloud Functions  
**Includes**:
- resourceService API documentation
- readingProgressService API
- recommendationService API
- All other service APIs
- Cloud Functions specifications
- Request/response examples

**Size**: ~600 lines  
**Dependency**: None (reference document)

---

## CATEGORY B: SERVICE LAYER (JavaScript Service Classes)

### B1. `js/services/resourceService.js`
**Status**: NEW (Core)  
**Purpose**: Central service for all resource discovery, CRUD, search operations  
**Key Methods**:
- `loadResources(forceRefresh)` — Load all published resources with caching
- `searchResources(query, filters)` — Full-text search + filter support
- `getResourceById(id)` — Get single resource
- `getResourcesByAcademy(academyId)` — Filter by academy
- `getResourcesByType(type)` — Filter by resource type
- `getResourcesByDifficulty(level)` — Filter by difficulty
- `getPopularResources(limit)` — Get top-rated resources
- `getRatedResources(minRating)` — Get resources above rating threshold
- `createResource(data)` — Admin: create resource
- `updateResource(id, data)` — Admin: update resource
- `deleteResource(id)` — Admin: delete resource

**Caching**: 5-minute cache (pattern: courseService.js)  
**Size**: ~350 lines  
**Dependencies**: firebase.js, utils/resourceNormalizer.js

---

### B2. `js/services/readingProgressService.js`
**Status**: REFACTOR (currently empty)  
**Purpose**: Track learner reading activity and statistics  
**Key Methods**:
- `updateProgress(studentId, resourceId, progress)` — Update reading progress
- `markCompleted(studentId, resourceId)` — Mark resource as completed
- `getProgress(studentId, resourceId)` — Get progress for one resource
- `getReadingHistory(studentId, limit)` — Get recently read resources
- `getReadingStreak(studentId)` — Get consecutive reading days
- `getReadingStats(studentId)` — Total time, resources, streak
- `getInProgressResources(studentId)` — Currently reading resources
- `getCompletedResources(studentId)` — Finished resources

**Real-Time**: Subcollection queries on `reading_progress/{studentId}`  
**Size**: ~300 lines  
**Dependencies**: firebase.js, readingProgressService patterns

---

### B3. `js/services/bookmarkService.js`
**Status**: REFACTOR (currently empty)  
**Purpose**: Manage saved resources and likes  
**Key Methods**:
- `saveResource(studentId, resourceId)` — Add to saved/favorites
- `unsaveResource(studentId, resourceId)` — Remove from saved
- `getSavedResources(studentId)` — Get all saved resources
- `isSaved(studentId, resourceId)` — Check if saved
- `likeResource(studentId, resourceId)` — Like a resource
- `unlikeResource(studentId, resourceId)` — Unlike a resource
- `getLikedResources(studentId)` — Get liked resources
- `isLiked(studentId, resourceId)` — Check if liked

**Writes**: Update `reading_progress/{studentId}/{resourceId}` isSaved/isLiked fields  
**Size**: ~250 lines  
**Dependencies**: firebase.js, readingProgressService.js

---

### B4. `js/services/recommendationService.js`
**Status**: NEW  
**Purpose**: Generate personalized resource recommendations  
**Key Methods**:
- `generateRecommendations(studentId)` — Compute recommendations based on learning profile
- `getRecommendationsForStudent(studentId, limit)` — Get cached recommendations
- `getRecommendationsBasedOnCourse(courseId, studentId)` — Suggest resources for active course
- `getRecommendationsBasedOnHistory(studentId, limit)` — Based on reading history
- `getRecommendationReason(reason)` — Map reason enum to user-friendly text
- `cacheRecommendations(studentId, recommendations)` — Store generated recommendations

**Algorithm**: 
- 40% based on enrolled Academies
- 30% based on reading history + progress
- 20% based on course enrollments
- 10% trending + popular

**Real-Time**: Pulls from reading_progress, enrollments, students  
**Caching**: 1-hour cache  
**Size**: ~400 lines  
**Dependencies**: firebase.js, progressService.js, courseService.js, enrollmentService.js

---

### B5. `js/services/learningCollectionService.js`
**Status**: NEW  
**Purpose**: Manage curated learning collections (course + resource bundles)  
**Key Methods**:
- `getCollections()` — Get all published collections
- `getCollectionById(id)` — Get collection with full details
- `getCollectionsByCourse(courseId)` — Get collections that include course
- `getCollectionsByAcademy(academyId)` — Get collections for academy
- `getCollectionProgress(studentId, collectionId)` — Track progress through collection
- `enrollInCollection(studentId, collectionId)` — Start collection
- `updateCollectionProgress(studentId, collectionId, progress)` — Update as learner progresses
- `completeCollection(studentId, collectionId)` — Mark collection complete

**Collection Data**: Combines courses + resources + milestones  
**Progress Tracking**: Tracks which courses/resources completed  
**Caching**: 10-minute cache  
**Size**: ~300 lines  
**Dependencies**: firebase.js, courseService.js, resourceService.js

---

### B6. `js/services/readingPathService.js`
**Status**: NEW  
**Purpose**: Manage guided learning journeys with milestones  
**Key Methods**:
- `getReadingPaths()` — Get all published reading paths
- `getReadingPathById(id)` — Get path with sections and resources
- `getReadingPathsByAcademy(academyId)` — Get paths for academy
- `getPathProgress(studentId, pathId)` — Get learner progress through path
- `updatePathProgress(studentId, pathId, sectionIndex)` — Mark section complete
- `generateReadingPathCertificate(studentId, pathId)` — Create completion cert
- `getPathCompletion(studentId, pathId)` — Get % complete

**Path Structure**: Organized in sections with lessons + resources + quizzes  
**Completion Tracking**: Track which sections/milestones completed  
**Certificate**: Stored in Cloud Storage, linked in career portfolio  
**Size**: ~320 lines  
**Dependencies**: firebase.js, progressService.js, certificateService.js

---

### B7. `js/services/careerPortfolioService.js`
**Status**: NEW  
**Purpose**: Aggregate and manage learner achievements  
**Key Methods**:
- `getPortfolio(studentId)` — Get full career portfolio
- `updatePortfolio(studentId, data)` — Update portfolio fields
- `addCertificate(studentId, certId)` — Link certificate
- `addSkill(studentId, skill, level)` — Add verified skill
- `removeCertificate(studentId, certId)` — Remove certificate
- `removeSkill(studentId, skill)` — Remove skill
- `getBadges(studentId)` — Get earned badges
- `generatePortfolioSummary(studentId)` — Create summary for sharing
- `getReadingAchievements(studentId)` — Extract reading stats

**Aggregates**: Certificates, courses, reading achievements, projects, skills, XP, badges  
**Real-Time**: Pulls from reading_progress, enrollments, certificates  
**Size**: ~350 lines  
**Dependencies**: firebase.js, readingProgressService.js, enrollmentService.js, certificateService.js

---

## CATEGORY C: UTILITY & HELPER FUNCTIONS

### C1. `js/utils/resourceNormalizer.js`
**Status**: NEW  
**Purpose**: Normalize resource data from Firestore  
**Key Functions**:
- `normalizeResource(doc)` — Convert Firestore doc to app format
- `normalizeResources(docs)` — Batch normalize
- `addCached(resource, isCached)` — Mark as cached
- `formatResourceTime(minutes)` — Format duration (e.g., "45 mins", "2 hours")
- `getThumbnailURL(resource)` — Get best thumbnail source
- `getContentURL(resource)` — Get best content source

**Purpose**: Consistent data shape across app, same pattern as courseNormalizer  
**Size**: ~150 lines  
**Dependencies**: firebase.js

---

### C2. `js/utils/searchHelpers.js`
**Status**: NEW  
**Purpose**: Search and filter utilities  
**Key Functions**:
- `buildSearchQuery(query, filters)` — Build Firestore query from search input
- `filterByAcademy(query, academyId)` — Add academy filter
- `filterByType(query, type)` — Add resource type filter
- `filterByDifficulty(query, level)` — Add difficulty filter
- `filterByDateRange(query, startDate, endDate)` — Date filter
- `sortByRelevance(results, query)` — Sort by relevance
- `sortByRating(results)` — Sort by rating
- `sortByNewest(results)` — Sort by date
- `fuzzySearch(query, items)` — Client-side fuzzy matching

**Purpose**: Reusable search logic for Knowledge Hub and other features  
**Size**: ~200 lines  
**Dependencies**: None (pure functions)

---

### C3. `js/utils/recommendationAlgorithm.js`
**Status**: NEW  
**Purpose**: Algorithm for generating personalized recommendations  
**Key Functions**:
- `scoreResource(resource, studentProfile)` — Calculate relevance score (0-100)
- `scoreAcademyAlignment(resource, academyIds)` — Score academy match
- `scoreHistoryAlignment(resource, history)` — Score based on reading history
- `scoreSkillGap(resource, skills)` — Score based on skill needs
- `rankByRelevance(scored)` — Sort by score
- `diversifyRecommendations(scored)` — Ensure variety
- `getPriorityTier(score)` — Map score to priority

**Algorithm**: Weighted scoring, ensured diversity, time-sensitive  
**Size**: ~250 lines  
**Dependencies**: None (pure functions)

---

## CATEGORY D: UI COMPONENTS (ES6 Modules)

### D1. `js/components/resourceSearch/SearchBar.js`
**Status**: NEW  
**Purpose**: Search input with type-ahead suggestions  
**Exports**: `createSearchBar(container, options)`  
**Features**:
- Real-time search input
- Type-ahead suggestions (via aiOrchestrator)
- Search history (localStorage)
- Keyboard navigation (arrow keys, enter)
- Clear button
- Search filters trigger

**DOM Structure**: Input, suggestions dropdown, history list  
**Size**: ~250 lines  
**Dependencies**: resourceService.js, aiOrchestrator.js

---

### D2. `js/components/resourceSearch/FilterPanel.js`
**Status**: NEW  
**Purpose**: Multi-select filters for resource discovery  
**Exports**: `createFilterPanel(container, options)`  
**Filters**: Academy, Type, Difficulty, Duration, Rating, Date Range, Tags  
**Features**:
- Checkbox filters
- Range sliders (duration, rating)
- Expandable/collapsible sections
- Apply/Reset buttons
- Filter count badge
- Persists to localStorage

**DOM Structure**: Filter groups, checkboxes, sliders, buttons  
**Size**: ~300 lines  
**Dependencies**: searchHelpers.js

---

### D3. `js/components/resourceSearch/ResourceGrid.js`
**Status**: NEW  
**Purpose**: Responsive grid of resource cards  
**Exports**: `createResourceGrid(container, resources, options)`  
**Features**:
- Responsive 1-4 columns
- Skeleton loaders while loading
- Lazy loading as you scroll
- Pagination or infinite scroll
- Empty state handling
- Loading states

**DOM Structure**: Grid container, resource cards  
**Size**: ~200 lines  
**Dependencies**: ResourceCard.js, searchHelpers.js

---

### D4. `js/components/resourceSearch/ResourceCard.js`
**Status**: NEW  
**Purpose**: Individual resource card in grid  
**Exports**: `createResourceCard(resource, options)`  
**Features**:
- Thumbnail image (lazy load)
- Title, description (truncated)
- Metadata: academy, difficulty, time, rating
- Action buttons: Open, Download, Save, Share
- Hover effects (glass design)
- Badge for certificate/featured

**DOM Structure**: Card with image, content, actions  
**Size**: ~280 lines  
**Dependencies**: resourceService.js, bookmarkService.js

---

### D5. `js/components/resourceSearch/ResourceDetail.js`
**Status**: NEW  
**Purpose**: Full-page resource view  
**Exports**: `renderResourceDetail(resource)`  
**Features**:
- Large thumbnail
- Full title, description, metadata
- Author, publication date
- Related resources carousel
- Professor SWORD widget
- Action buttons: Open, Download, Save, Like, Share
- Tabs: Overview, Related, Highlights, Notes
- Reading progress bar (if student)
- Comments/discussion (if enabled)

**DOM Structure**: Large layout with content sections  
**Size**: ~400 lines  
**Dependencies**: resourceService.js, bookmarkService.js, readingProgressService.js, aiOrchestrator.js

---

### D6. `js/components/reading/ContinueReading.js`
**Status**: NEW  
**Purpose**: Carousel of in-progress resources  
**Exports**: `createContinueReadingCarousel(container, studentId)`  
**Features**:
- Show 3-5 most recently accessed resources
- Progress bar per resource
- "Continue" button per resource
- Time spent indicator
- Empty state if no reading in progress
- Skeleton loader while fetching

**DOM Structure**: Carousel of resource cards  
**Size**: ~220 lines  
**Dependencies**: readingProgressService.js

---

### D7. `js/components/reading/ReadingStats.js`
**Status**: NEW  
**Purpose**: Display reading statistics widget  
**Exports**: `createReadingStatsWidget(container, studentId)`  
**Features**:
- Total resources completed
- Total time spent (with unit conversion)
- Current streak (consecutive days)
- Reading goal progress (this week)
- Animated counters

**DOM Structure**: Grid of 4-5 stat cards  
**Size**: ~180 lines  
**Dependencies**: readingProgressService.js

---

### D8. `js/components/reading/HighlightsPanel.js`
**Status**: NEW  
**Purpose**: View and manage highlights from resources  
**Exports**: `createHighlightsPanel(container, resourceId, studentId)`  
**Features**:
- List of highlights with context
- Color-coded highlights
- Notes attached to highlights
- Filter by color
- Delete highlight
- Export highlights (PDF, markdown)

**DOM Structure**: List of highlight cards  
**Size**: ~240 lines  
**Dependencies**: progressService.js (reading_notes)

---

### D9. `js/components/reading/NotesPanel.js`
**Status**: NEW  
**Purpose**: Create and manage reading notes  
**Exports**: `createNotesPanel(container, resourceId, studentId)`  
**Features**:
- Add new notes
- List existing notes
- Edit/delete notes
- Tag notes (tagged for questions, concepts, etc.)
- Search notes
- Export notes

**DOM Structure**: Note input, notes list  
**Size**: ~260 lines  
**Dependencies**: progressService.js (reading_notes)

---

### D10. `js/components/ai/AIProfessorWidget.js`
**Status**: NEW  
**Purpose**: Ask Professor SWORD about resources  
**Exports**: `createAIProfessorWidget(container, resourceId)`  
**Features**:
- "Ask Professor SWORD" button
- Input for questions
- AI responses displayed
- Quick questions: Summarize, Explain, Quiz, Flashcards
- Suggested follow-ups
- Chat history (per resource)
- Loading state with typing indicator

**DOM Structure**: Widget with input, chat window, suggestions  
**Size**: ~320 lines  
**Dependencies**: aiOrchestrator.js

---

### D11. `js/components/ai/SummaryPanel.js`
**Status**: NEW  
**Purpose**: Display AI-generated resource summary  
**Exports**: `createSummaryPanel(container, resourceId)`  
**Features**:
- Generate summary button
- Loading state with skeleton
- Expandable summary sections
- Key points bullet list
- Copy summary button
- Related concepts highlighted

**DOM Structure**: Summary content area  
**Size**: ~200 lines  
**Dependencies**: aiOrchestrator.js

---

### D12. `js/components/ai/QuizGenerator.js`
**Status**: NEW  
**Purpose**: AI-generated quiz from resource content  
**Exports**: `createQuizGenerator(container, resourceId)`  
**Features**:
- Generate quiz button (10 questions default)
- Question types: multiple choice, true/false, short answer
- Difficulty selection
- Question display with answers
- Score calculation
- Review mode
- Export results

**DOM Structure**: Quiz interface  
**Size**: ~350 lines  
**Dependencies**: aiOrchestrator.js, quizService.js

---

### D13. `js/components/ai/FlashcardPanel.js`
**Status**: NEW  
**Purpose**: Study flashcards generated from resource  
**Exports**: `createFlashcardPanel(container, resourceId)`  
**Features**:
- Generate flashcards button (10-20 cards)
- Flip animation
- Navigation: previous, next
- Mark as known/review
- Progress indicator
- Study options: random order, review only
- Export deck

**DOM Structure**: Flashcard interface  
**Size**: ~280 lines  
**Dependencies**: aiOrchestrator.js, progressService.js

---

### D14. `js/components/portfolio/CertificateGallery.js`
**Status**: NEW  
**Purpose**: Display earned certificates  
**Exports**: `createCertificateGallery(container, studentId)`  
**Features**:
- Grid of certificate thumbnails
- Click to view full certificate
- Certificate metadata: date earned, issuer
- Download certificate button
- Share certificate option
- Empty state if no certificates
- Filter by date range

**DOM Structure**: Grid of certificate cards  
**Size**: ~220 lines  
**Dependencies**: careerPortfolioService.js, certificateService.js

---

### D15. `js/components/portfolio/SkillsList.js`
**Status**: NEW  
**Purpose**: Display learner skills and proficiency levels  
**Exports**: `createSkillsList(container, studentId)`  
**Features**:
- List of verified skills
- Proficiency levels: Beginner, Intermediate, Advanced
- Skill badge/icon
- Date skill added
- Edit/remove skills (if admin)
- Group by category
- Endorsement count (if enabled)

**DOM Structure**: Skills list  
**Size**: ~200 lines  
**Dependencies**: careerPortfolioService.js

---

### D16. `js/components/portfolio/BadgesDisplay.js`
**Status**: NEW  
**Purpose**: Show earned badges/achievements  
**Exports**: `createBadgesDisplay(container, studentId)`  
**Features**:
- Grid of earned badges
- Badge tooltip: name, description, date earned
- Achievement progress (e.g., "Read 10 resources: 7/10")
- Filter by type or date
- Total badge count
- Shareable badge list

**DOM Structure**: Badge grid  
**Size**: ~200 lines  
**Dependencies**: careerPortfolioService.js

---

## CATEGORY E: PAGE TEMPLATES (HTML + CSS)

### E1. `knowledge-hub.html`
**Status**: NEW  
**Purpose**: Main Knowledge Hub discovery page  
**Features**:
- Full-page resource discovery experience
- SearchBar component at top
- FilterPanel on left (desktop) / bottom (mobile)
- ResourceGrid in main area
- Recently viewed sidebar
- Trending resources carousel
- Navigation (back to academy/course if referrer)
- Responsive layout

**Layout**: 2-column (desktop), 1-column (mobile)  
**Size**: ~200 lines HTML  
**CSS**: ~400 lines (knowledge-hub.css)  
**Script**: ~100 lines inline setup

---

### E2. `my-bookshelf.html`
**Status**: NEW  
**Purpose**: Personalized reading hub for authenticated learners  
**Features**:
- Hero: Reading stats and goals
- Continue Reading carousel (top)
- Reading goal progress
- Tabs: Continue, Saved, Liked, History, Collections
- Reading stats sidebar
- Recommended resources carousel
- Reading streak badge
- Goal settings modal

**Layout**: 1-2 column depending on content  
**Size**: ~250 lines HTML  
**CSS**: ~300 lines (reading.css extended)  
**Script**: ~200 lines

---

### E3. `learning-collections.html`
**Status**: NEW  
**Purpose**: Browse and enroll in curated learning collections  
**Features**:
- Page header with description
- Filter: By academy, difficulty, topic
- Grid of collection cards
- Collection detail modal (preview before enroll)
- Enroll button
- Progress indicator for enrolled collections
- Empty state if no collections

**Layout**: Grid  
**Size**: ~200 lines HTML  
**CSS**: ~250 lines  
**Script**: ~150 lines

---

### E4. `reading-paths.html`
**Status**: NEW  
**Purpose**: Browse and follow guided reading journeys  
**Features**:
- Page header
- Filter: By academy, difficulty
- Grid of path cards (show progress if enrolled)
- Path detail modal with sections
- Enroll button
- Progress tracker (visual journey)
- Estimated time to completion
- Milestone badges

**Layout**: Grid with detail modals  
**Size**: ~220 lines HTML  
**CSS**: ~300 lines  
**Script**: ~180 lines

---

### E5. `career-portfolio.html`
**Status**: NEW  
**Purpose**: Showcase learner achievements  
**Features**:
- Hero: Student name, photo, headline
- Overview: Total certificates, courses, resources, XP
- Sections:
  - Certificates gallery
  - Skills list
  - Badges/achievements
  - Reading statistics
  - Recent learning activity
  - Recommended next paths
- Share portfolio button
- Print-friendly layout
- Public/private toggle

**Layout**: 1-column  
**Size**: ~300 lines HTML  
**CSS**: ~400 lines (portfolio.css)  
**Script**: ~200 lines

---

## CATEGORY F: STYLES

### F1. `css/knowledge-hub.css`
**Status**: NEW  
**Purpose**: Styles for Knowledge Hub discovery pages  
**Includes**:
- Search bar styles (with glass morphism)
- Filter panel styles (responsive)
- Resource grid (responsive columns)
- Resource card styles (hover, active states)
- Resource detail layout
- Skeleton loaders
- Animations (fade-in, scale-up)
- Responsive breakpoints

**Extends**: shared-utilities.css, glassmorphism patterns  
**Size**: ~400 lines

---

### F2. `css/reading.css`
**Status**: NEW  
**Purpose**: Styles for reading/progress features  
**Includes**:
- Continue reading carousel
- Reading stats widgets
- Progress bars and indicators
- Notes and highlights styling
- Reading history list
- Goal progress tracker
- Streak badge
- Tab navigation
- Empty states

**Extends**: shared-utilities.css  
**Size**: ~350 lines

---

### F3. `css/portfolio.css`
**Status**: NEW  
**Purpose**: Styles for career portfolio page  
**Includes**:
- Hero profile section
- Certificate gallery
- Skills list
- Badges grid
- Achievement cards
- Share preview modal
- Print styles
- Mobile responsive

**Extends**: shared-utilities.css  
**Size**: ~350 lines

---

## CATEGORY G: CLOUD FUNCTIONS (Firebase)

### G1. `functions/resources.js`
**Status**: NEW  
**Purpose**: Cloud Functions for resource operations  
**Functions**:
- `onResourceCreated()` — Trigger when resource added (update indexes, generate thumbnail)
- `onResourceUpdated()` — Trigger when resource updated
- `searchResources()` — HTTP endpoint for AI-powered search (backend)
- `getPopularResources()` — Compute trending resources (scheduled daily)
- `updateResourceRatings()` — Aggregate ratings (on-demand or scheduled)
- `syncAcademyResources()` — Link resources to academies (admin endpoint)

**Size**: ~300 lines  
**Triggers**: Firestore, HTTP, scheduled

---

### G2. `functions/recommendations.js`
**Status**: NEW  
**Purpose**: Generate personalized recommendations  
**Functions**:
- `generateRecommendationsOnProgress()` — Trigger when reading progress changes
- `batchGenerateRecommendations()` — Scheduled: generate for all students (daily 2 AM)
- `getRecommendations()` — HTTP endpoint to fetch recommendations
- `updateRecommendationCache()` — Keep cache fresh

**Size**: ~250 lines  
**Triggers**: Firestore, scheduled, HTTP

---

### G3. `functions/aiServices.js`
**Status**: NEW  
**Purpose**: AI/SWORD operations via Cloud Functions  
**Functions**:
- `summarizeResource()` — HTTP: Call LLM to summarize document
- `generateQuizFromResource()` — HTTP: Create quiz from resource
- `generateFlashcards()` — HTTP: Create flashcards from resource
- `recommendNextResources()` — HTTP: Get SWORD recommendations
- `explainConcept()` — HTTP: Deep explanation of concept
- `answerResourceQuestion()` — HTTP: Q&A about resource

**Size**: ~400 lines  
**Triggers**: HTTP only (called from browser)  
**Note**: Integrates with external LLM provider (Claude, GPT, etc.)

---

## CATEGORY H: INTEGRATION EXTENSIONS

### H1. Extend `dashboard.html`
**Status**: MODIFY  
**Purpose**: Add reading widgets to existing dashboard  
**Changes**:
- Add "Continue Reading" section near top
- Add "Recommended Resources" widget
- Add "Reading Goal" progress card
- Add "Reading Streak" badge in header
- Add link to My Bookshelf

**Location**: Modify inline styles + add new sections  
**Size**: ~200 lines added

---

### H2. Extend `course-template.html`
**Status**: MODIFY  
**Purpose**: Add related resources to course pages  
**Changes**:
- Add "Related Resources" section after course intro
- Add "Suggested Reading" sidebar widget
- Add "Downloadable Assets" section
- Add "Professor SWORD Study Notes" option
- Add "Add to Reading Path" button

**Location**: Modify course layout  
**Size**: ~250 lines added

---

### H3. Extend `academies` pages (multiple)
**Status**: MODIFY  
**Purpose**: Integrate Knowledge Hub resources to academy pages  
**Changes** (for each academy page):
- Add "Featured Resources" carousel
- Add "Toolkits" section
- Add "Recommended Books" section
- Add "Reading Paths" grid
- Add link to "Explore All Resources" for this academy

**Files Affected**: management-mastery-academy.html, etc.  
**Size**: ~150-200 lines per academy page

---

### H4. Extend `student/lesson.html`
**Status**: MODIFY  
**Purpose**: Add resource recommendations to lesson player  
**Changes**:
- Add "Related Resources" sidebar
- Add "Further Reading" section after lesson content
- Add Professor SWORD "Learn More" widget
- Add "Save resource for later" to resource suggestions

**Location**: Modify lesson layout  
**Size**: ~200 lines added

---

### H5. Update `js/ai/aiOrchestrator.js`
**Status**: EXTEND  
**Purpose**: Add Knowledge Hub AI capabilities  
**New Methods**:
- `searchResources(query)` — Natural language search
- `summarizeResource(resourceId)` — Summary generation
- `explainConcept(concept, context)` — Concept explanation
- `generateQuizzes(resourceId, count)` — Quiz generation
- `generateFlashcards(resourceId, count)` — Flashcard generation
- `recommendResources(studentId)` — AI recommendations
- `suggestNextCourses(studentId)` — Based on reading path
- `createReadingPlan(studentId, goal)` — Personalized plan

**Size**: ~400 lines (extends existing ~500 lines)

---

### H6. Update `js/services/dashboardService.js`
**Status**: EXTEND  
**Purpose**: Add reading features to dashboard data  
**New Methods**:
- `getContinueReading(studentId)` — In-progress resources
- `getRecommendedResources(studentId)` — Personalized suggestions
- `getReadingGoals(studentId)` — Goal tracking
- `getReadingStats(studentId)` — Reading statistics
- `getReadingStreak(studentId)` — Consecutive days

**Size**: ~200 lines added

---

## CATEGORY I: DOCUMENTATION (Markdown Files)

### I1. `docs/KNOWLEDGE-HUB-SCHEMA.md`
**Status**: NEW  
**Purpose**: Full Firestore schema documentation  
**Sections**:
- Collection overview
- Field specifications
- Indexes
- Security rules
- Data relationships
- Migration guide

**Size**: ~600 lines

---

### I2. `docs/KNOWLEDGE-HUB-API.md`
**Status**: NEW  
**Purpose**: API documentation for all services  
**Sections**:
- Service layer API (all 7 services)
- Cloud Functions API
- Request/response examples
- Error handling
- Pagination
- Caching behavior

**Size**: ~800 lines

---

### I3. `docs/KNOWLEDGE-HUB-IMPLEMENTATION.md`
**Status**: NEW  
**Purpose**: Detailed implementation guide  
**Sections**:
- Getting started
- Setting up Firestore
- Deploying Cloud Functions
- Running locally
- Testing procedures
- Troubleshooting

**Size**: ~500 lines

---

## SUMMARY TABLE

| Category | Type | Count | Status |
|----------|------|-------|--------|
| **A** | Schema/Docs | 2 | NEW |
| **B** | Services | 7 | NEW/EXTEND |
| **C** | Utilities | 3 | NEW |
| **D** | Components | 16 | NEW |
| **E** | Pages | 5 | NEW |
| **F** | Styles | 3 | NEW |
| **G** | Cloud Functions | 3 | NEW |
| **H** | Integrations | 6 | EXTEND |
| **I** | Documentation | 3 | NEW |
| **TOTAL** | | **48 items** | |

---

## IMPLEMENTATION PHASES

### Phase 1: Foundation (Week 1)
1. ✅ A1 — Schema documentation
2. ✅ A2 — API documentation
3. → B1 — resourceService.js
4. → C1 — resourceNormalizer.js
5. → C2 — searchHelpers.js

### Phase 2: Discovery (Week 2)
6. → B2 — readingProgressService.js
7. → D1-D5 — Search components
8. → E1 — Knowledge Hub page
9. → F1 — Knowledge Hub styles

### Phase 3: Personalization (Week 3)
10. → B3 — bookmarkService.js
11. → B4 — recommendationService.js
12. → D6-D9 — Reading components
13. → E2 — My Bookshelf page
14. → H1 — Extend Dashboard

### Phase 4: Learning Paths (Week 4)
15. → B5 — learningCollectionService.js
16. → B6 — readingPathService.js
17. → E3-E4 — Collection/Path pages
18. → F2 — Reading styles

### Phase 5: AI Integration (Week 5)
19. → D10-D13 — AI components
20. → H5 — Extend aiOrchestrator.js
21. → G3 — Cloud Functions for AI

### Phase 6: Portfolio & Integration (Week 6-7)
22. → B7 — careerPortfolioService.js
23. → D14-D16 — Portfolio components
24. → E5 — Portfolio page
25. → F3 — Portfolio styles
26. → H2-H4 — Extend existing pages
27. → G1-G2 — Resource/Recommendation functions

### Phase 7: Validation & Deployment
28. Full testing
29. Performance optimization
30. Accessibility audit
31. Deployment

---

**Next Step**: Begin Phase 1, File B1 — `js/services/resourceService.js`

