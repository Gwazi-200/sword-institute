/**
 * ============================================================
 * Sword Institute Knowledge Hub
 * Firestore Schema Documentation
 * ============================================================
 * 
 * This document defines all Firestore collections, fields,
 * indexes, relationships, and security rules for the
 * Knowledge Hub platform service.
 */

// ============================================================
// NEW COLLECTIONS
// ============================================================

/**
 * COLLECTION: knowledge_resources
 * ============================================================
 * 
 * Purpose: Central repository for all discoverable resources
 * (books, papers, videos, podcasts, articles, templates, etc.)
 * 
 * Access: Public read (published), admin/instructor write
 * Queries: Search by type, academy, difficulty, tags, rating
 */

// Document: knowledge_resources/{resourceId}
const knowledge_resources_example = {
    // Identifiers
    resourceId: "string",
    slug: "string",                    // URL-friendly slug
    
    // Content
    title: "string",                   // e.g., "The Art of Community Leadership"
    description: "string",             // 500+ char description
    shortDescription: "string",        // 140 char teaser for cards
    
    // Resource Metadata
    type: "enum",                      // book | paper | video | podcast | article | template | toolkit | case-study | download | policy | external | ai-resource
    thumbnailURL: "string",            // Cloud Storage path or external URL
    contentURL: "string",              // Cloud Storage path or external link
    format: "string",                  // pdf | video | audio | article | interactive | epub | html
    
    // Author & Attribution
    author: "string",                  // "Dr. Jane Smith"
    authorBio: "string",               // Optional bio/link
    publishedDate: "timestamp",
    updatedDate: "timestamp",
    createdAt: "timestamp",
    
    // Classification
    academy: "reference",              // → academies/{academyId}
    relatedCourses: ["reference"],     // → [courses/{courseId}, ...]
    tags: ["string"],                  // Searchable keywords: ["leadership", "community", "ngos"]
    
    // Difficulty & Time
    difficulty: "enum",                // beginner | intermediate | advanced
    estimatedTime: "number",           // minutes (e.g., 45 for 45 min read, 120 for 2 hour video)
    
    // Engagement Metrics
    rating: "number",                  // Average rating (0-5)
    ratingCount: "number",             // Number of ratings
    views: "number",                   // View count
    downloads: "number",               // Download count
    saves: "number",                   // Times saved/bookmarked
    shares: "number",                  // Times shared
    
    // Status
    isPublished: "boolean",            // Show in discovery?
    isSponsored: "boolean",            // Sponsored content?
    isFeatured: "boolean",             // Feature on homepage?
    
    // Metadata
    language: "string",                // "en"
    metadata: {
        wordCount: "number",           // For articles/papers
        videoLength: "number",         // For videos (minutes)
        fileSize: "string",            // e.g., "2.4MB"
        prerequisites: ["string"],     // e.g., ["AI Basics", "Python Fundamentals"]
        certifications: ["string"],    // Linked certifications
        contributors: ["string"],      // Additional authors/editors
    }
};

/**
 * Firestore Indexes for knowledge_resources
 * ============================================================
 * 
 * CREATE COMPOSITE INDEX:
 * - academy + isPublished
 * - type + isPublished + rating (desc)
 * - difficulty + isPublished
 * - tags + isPublished
 * - isPublished + createdAt (desc)
 * 
 * ENSURE BASIC INDEXES:
 * - academy (ascending)
 * - type (ascending)
 * - difficulty (ascending)
 * - tags (array index)
 * - isPublished (ascending)
 * - createdAt (descending)
 * - rating (descending)
 */

// ============================================================

/**
 * COLLECTION: reading_progress
 * ============================================================
 * 
 * Purpose: Track learner reading activity and completion status
 * 
 * Structure: Subcollection per student
 * Path: reading_progress/{studentId}/{resourceId}
 * 
 * Access: Student reads/writes own data, admin can read all
 * 
 * Queries:
 * - Get all resources in-progress for student
 * - Get completed resources for student
 * - Find last accessed resources
 */

// Document: reading_progress/{studentId}/{resourceId}
const reading_progress_example = {
    studentId: "reference",            // → students/{studentId}
    resourceId: "reference",           // → knowledge_resources/{resourceId}
    
    // Progress State
    status: "enum",                    // not-started | in-progress | completed
    progress: "number",                // 0-100 percent
    currentPage: "number",             // For PDFs: current page number
    
    // Engagement
    notesCount: "number",              // How many notes/highlights on this resource
    highlightCount: "number",
    
    // Interaction
    isSaved: "boolean",                // Bookmarked/favorited?
    isLiked: "boolean",                // Liked/appreciated?
    
    // Timestamps
    lastAccessedAt: "timestamp",       // When last opened
    completedAt: "timestamp",          // null if not completed
    createdAt: "timestamp",
    
    // Time Tracking
    timeSpent: "number",               // Total seconds spent on resource
    sessionCount: "number",            // How many times opened
};

/**
 * Firestore Indexes for reading_progress
 * ============================================================
 * 
 * CREATE COMPOSITE INDEX:
 * - studentId + status
 * - studentId + lastAccessedAt (desc)
 * - studentId + completedAt (desc)
 * 
 * ENSURE BASIC INDEXES:
 * - studentId (ascending)
 * - status (ascending)
 * - completedAt (descending)
 */

// ============================================================

/**
 * COLLECTION: reading_notes
 * ============================================================
 * 
 * Purpose: Store student notes, highlights, and annotations
 * 
 * Structure: Subcollection per student
 * Path: reading_notes/{studentId}/{noteId}
 * 
 * Access: Student reads/writes own notes, admin can read all
 */

// Document: reading_notes/{studentId}/{noteId}
const reading_notes_example = {
    studentId: "reference",            // → students/{studentId}
    resourceId: "reference",           // → knowledge_resources/{resourceId}
    noteId: "string",                  // Auto-generated ID
    
    // Note Type
    type: "enum",                      // note | highlight | question
    
    // Content
    content: "string",                 // The note text or question
    context: "string",                 // Surrounding text (for highlights)
    pageNumber: "number",              // For PDFs
    
    // Highlight Styling
    colorTag: "string",                // yellow | blue | green | red | purple
    
    // Status
    isFlagged: "boolean",              // Flagged for follow-up (for questions)
    
    // Timestamps
    createdAt: "timestamp",
    updatedAt: "timestamp",
};

/**
 * Firestore Indexes for reading_notes
 * ============================================================
 * 
 * ENSURE BASIC INDEXES:
 * - studentId (ascending)
 * - resourceId (ascending)
 * - createdAt (descending)
 * - type (ascending)
 */

// ============================================================

/**
 * COLLECTION: learning_collections
 * ============================================================
 * 
 * Purpose: Curated bundles combining courses + resources
 * 
 * Example: "From Community Member to Leader"
 *   - Includes 3 courses
 *   - + 8 recommended reading resources
 *   - + 2 templates/toolkits
 *   - Estimated 6 weeks
 *   - Completion certificate
 * 
 * Access: Public read (published), admin write
 */

// Document: learning_collections/{collectionId}
const learning_collections_example = {
    collectionId: "string",
    slug: "string",
    
    // Content
    title: "string",
    description: "string",
    thumbnailURL: "string",
    
    // Organization
    academy: "reference",              // → academies/{academyId}
    
    // Contents
    courses: ["reference"],            // → [courses/{courseId}, ...]
    resources: ["reference"],          // → [knowledge_resources/{resourceId}, ...]
    quizzes: ["reference"],            // → [quizzes/{quizId}, ...]
    relatedCollections: ["reference"], // Suggested collections to take next
    
    // Metadata
    difficulty: "enum",                // beginner | intermediate | advanced
    estimatedDuration: "number",       // Total hours or weeks (e.g., 40 for 40 hours)
    estimatedUnit: "enum",             // hours | weeks
    
    // Completion
    completionCertificate: "string",   // Certificate template ID
    objectives: ["string"],            // Learning outcomes
    
    // Status
    isPublished: "boolean",
    
    // Timestamps
    createdAt: "timestamp",
    updatedAt: "timestamp",
};

/**
 * Firestore Indexes for learning_collections
 * ============================================================
 * 
 * ENSURE BASIC INDEXES:
 * - isPublished (ascending)
 * - academy (ascending)
 * - difficulty (ascending)
 */

// ============================================================

/**
 * COLLECTION: reading_paths
 * ============================================================
 * 
 * Purpose: Guided learning journeys with ordered milestones
 * 
 * Example: "AI Basics to AI Leadership (8 weeks)"
 *   - Section 1: AI Fundamentals (3 resources, 1 lesson, 1 quiz)
 *   - Section 2: AI Ethics & Responsibility (2 resources, 1 lesson)
 *   - Section 3: Leading AI Teams (4 resources, 1 lesson, 1 project)
 * 
 * Access: Public read (published), admin write
 */

// Document: reading_paths/{pathId}
const reading_paths_example = {
    pathId: "string",
    slug: "string",
    
    // Identity
    title: "string",
    description: "string",
    
    // Organization
    academy: "reference",              // → academies/{academyId}
    
    // Structure: Ordered sections with learning content
    sections: [
        {
            title: "string",           // e.g., "Foundations"
            description: "string",
            order: "number",           // 1, 2, 3...
            
            // Ordered content within section
            lessons: ["reference"],    // → [lessons/{lessonId}, ...]
            resources: ["reference"],  // → [knowledge_resources/{resourceId}, ...]
            quizzes: ["reference"],    // → [quizzes/{quizId}, ...]
            projects: ["reference"],   // Optional: [projects/{projectId}, ...]
            
            // Milestone
            isMilestone: "boolean",    // Award badge on completion?
            milestoneBadge: "string",  // Badge ID if milestone
        }
    ],
    
    // Completion
    completionCertificate: "string",
    
    // Metadata
    difficulty: "enum",
    estimatedWeeks: "number",
    learningOutcomes: ["string"],
    
    // Status
    isPublished: "boolean",
    
    // Timestamps
    createdAt: "timestamp",
    updatedAt: "timestamp",
};

/**
 * Firestore Indexes for reading_paths
 * ============================================================
 * 
 * ENSURE BASIC INDEXES:
 * - isPublished (ascending)
 * - academy (ascending)
 * - difficulty (ascending)
 */

// ============================================================

/**
 * COLLECTION: resource_recommendations
 * ============================================================
 * 
 * Purpose: Pre-computed or cached personalized recommendations
 * 
 * Note: These can be generated on-demand or batch-computed
 * 
 * Access: Student reads own, Cloud Functions writes
 */

// Document: resource_recommendations/{studentId}/{recommendationId}
const resource_recommendations_example = {
    studentId: "reference",            // → students/{studentId}
    
    // Recommendation
    resource: "reference",             // → knowledge_resources/{resourceId}
    reason: "enum",                    // based-on-course | based-on-history | trending | academy-suggested | skill-gap | prerequisite
    
    // Scoring
    relevanceScore: "number",          // 0-100
    priority: "enum",                  // high | medium | low
    
    // Tracking
    createdAt: "timestamp",
    expiresAt: "timestamp",            // Cache TTL: valid for 7 days
    dismissed: "boolean",              // User dismissed?
};

/**
 * Firestore Indexes for resource_recommendations
 * ============================================================
 * 
 * ENSURE BASIC INDEXES:
 * - studentId + expiresAt (desc)
 */

// ============================================================

/**
 * COLLECTION: career_portfolios
 * ============================================================
 * 
 * Purpose: Aggregated learning achievements and credentials
 * 
 * Access: Student reads own, Cloud Functions writes, admin reads
 */

// Document: career_portfolios/{studentId}
const career_portfolios_example = {
    studentId: "reference",            // → students/{studentId}
    
    // Achievements
    certificates: ["reference"],       // → [certificates/{certId}, ...]
    completedCourses: ["reference"],   // → [courses/{courseId}, ...]
    completedCollections: ["reference"],
    
    // Reading Achievements
    readingAchievements: {
        totalResourcesCompleted: "number",
        totalTimeSpent: "number",      // minutes
        currentStreak: "number",       // consecutive days
        longestStreak: "number",
        badges: ["string"],            // e.g., ["reader-5", "reader-50", "consistency-7"]
    },
    
    // Projects & Portfolio
    projects: ["reference"],           // → [projects/{projectId}, ...]
    
    // Skills (Verified by admin or auto-inferred)
    skills: [
        {
            skillName: "string",
            level: "enum",             // beginner | intermediate | advanced
            verifiedAt: "timestamp",
            source: "string",          // "course" | "assessment" | "project" | "manual"
        }
    ],
    
    // Gamification
    totalXP: "number",
    badgeCount: "number",
    achievements: {
        "badge-id": "timestamp",       // Badge earned timestamp
    },
    
    // Timestamps
    createdAt: "timestamp",
    updatedAt: "timestamp",
};

// ============================================================
// EXTENSIONS TO EXISTING COLLECTIONS
// ============================================================

/**
 * COLLECTION: students (Extensions)
 * ============================================================
 * 
 * Add these fields to existing students/{studentId} documents
 */

const students_extensions = {
    // Reading Personalization
    readingGoal: "number",             // pages or minutes per week
    readingLevel: "enum",              // beginner | intermediate | advanced
    preferredTopics: ["string"],       // Interests for recommendations
    
    // Reading Activity
    readingStreak: "number",           // consecutive days with reading
    lastReadAt: "timestamp",
    totalResourcesCompleted: "number",
    savedResourcesCount: "number",
};

// ============================================================

/**
 * COLLECTION: courses (Extensions)
 * ============================================================
 * 
 * Add these fields to existing courses/{courseId} documents
 */

const courses_extensions = {
    // Knowledge Hub Integration
    relatedResources: ["reference"],   // → [knowledge_resources/{resourceId}, ...]
    suggestedReadingOrder: ["reference"],
    
    // Assets
    downloadableAssets: [
        {
            name: "string",            // "Week 1 Handout"
            url: "string",             // Cloud Storage path
            type: "string",            // "pdf" | "docx" | "xlsx"
            uploadedAt: "timestamp",
        }
    ],
};

// ============================================================

/**
 * COLLECTION: academies (Extensions)
 * ============================================================
 * 
 * Add these fields to existing academies documents
 * (stored as ACADEMY_DATA in academies.js or Firestore)
 */

const academies_extensions = {
    // Knowledge Hub Integration
    featuredResources: ["reference"],  // → [knowledge_resources/{resourceId}, ...]
    toolkits: ["reference"],           // Template/toolkit resources
    recommendedBooks: ["reference"],   // Curated reading list
    readingPaths: ["reference"],       // → [reading_paths/{pathId}, ...]
    
    // Metadata
    resourceCount: "number",           // Total resources available
    averageReadingTime: "number",      // Average minutes per resource
};

// ============================================================
// FIRESTORE SECURITY RULES
// ============================================================

/**
 * FIRESTORE SECURITY RULES
 * ============================================================
 * 
 * Copy and paste into Firebase Console > Firestore > Rules
 * 
 * These rules implement:
 * - Public read for published resources
 * - Personal read/write for student data
 * - Admin-only write for content
 * - Cloud Functions write permission for recommendations
 */

const SECURITY_RULES = `
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // ==================== PUBLIC RESOURCES ====================
    
    match /knowledge_resources/{document=**} {
      allow read: if resource.data.isPublished == true;
      allow create, update, delete: if request.auth.token.admin == true || 
                                      request.auth.token.role == 'instructor';
    }
    
    // ==================== PERSONAL READING PROGRESS ====================
    
    match /reading_progress/{studentId}/{document=**} {
      allow read, write: if request.auth.uid == studentId || 
                           request.auth.token.admin == true;
    }
    
    // ==================== PERSONAL READING NOTES ====================
    
    match /reading_notes/{studentId}/{document=**} {
      allow read, write: if request.auth.uid == studentId || 
                           request.auth.token.admin == true;
    }
    
    // ==================== PUBLIC COLLECTIONS ====================
    
    match /learning_collections/{document=**} {
      allow read: if resource.data.isPublished == true;
      allow create, update, delete: if request.auth.token.admin == true;
    }
    
    // ==================== PUBLIC READING PATHS ====================
    
    match /reading_paths/{document=**} {
      allow read: if resource.data.isPublished == true;
      allow create, update, delete: if request.auth.token.admin == true;
    }
    
    // ==================== PERSONAL RECOMMENDATIONS ====================
    
    match /resource_recommendations/{studentId}/{document=**} {
      allow read: if request.auth.uid == studentId;
      allow write: if request.auth.token.cloudFunction == true;
    }
    
    // ==================== PERSONAL PORTFOLIO ====================
    
    match /career_portfolios/{studentId} {
      allow read: if request.auth.uid == studentId || 
                     request.auth.token.admin == true;
      allow write: if request.auth.token.cloudFunction == true;
    }
    
    // ==================== EXISTING COLLECTIONS (NO CHANGE) ====================
    
    match /students/{document=**} {
      allow read: if request.auth.uid == document || request.auth.token.admin == true;
      allow update: if request.auth.uid == document || request.auth.token.admin == true;
    }
    
    match /courses/{document=**} {
      allow read: if true; // Public read
      allow write: if request.auth.token.admin == true;
    }
    
    match /{document=**} {
      allow read, write: if request.auth.token.admin == true;
    }
  }
}
`;

// ============================================================
// DEPLOYMENT STEPS
// ============================================================

/**
 * STEPS TO DEPLOY THIS SCHEMA
 * ============================================================
 * 
 * 1. MANUAL FIRESTORE SETUP (Console)
 *    - Go to Firebase Console > Project > Firestore Database
 *    - Create new database (if not exists)
 *    - Enable these regions: us-central1
 * 
 * 2. CREATE COLLECTIONS (Optional - Can auto-create on first write)
 *    Collections auto-create when first document is written,
 *    OR manually create empty collections for organization:
 *    - knowledge_resources
 *    - reading_progress
 *    - reading_notes
 *    - learning_collections
 *    - reading_paths
 *    - resource_recommendations
 *    - career_portfolios
 * 
 * 3. DEPLOY SECURITY RULES
 *    - Copy SECURITY_RULES above
 *    - Go to Firestore > Rules
 *    - Paste and Publish
 * 
 * 4. CREATE INDEXES
 *    - Firestore will suggest indexes as queries are made
 *    - Monitor Logs > Errors for index creation links
 *    - Alternatively, create manually in console:
 *      - Go to Firestore > Indexes > Composite
 *      - Create indexes listed above for each collection
 * 
 * 5. MIGRATE EXTENSIONS TO EXISTING COLLECTIONS
 *    - Update students/{studentId} documents with new fields
 *    - Update courses/{courseId} documents with new fields
 *    - Update academies records with new fields
 * 
 * 6. SEED SAMPLE DATA
 *    - Use admin SDK or console to add sample resources
 *    - Create sample collections and reading paths
 *    - Verify queries work as expected
 * 
 * 7. DEPLOY CLOUD FUNCTIONS
 *    - Deploy functions/resources.js
 *    - Deploy functions/recommendations.js
 *    - Deploy functions/aiServices.js
 */

export {
    knowledge_resources_example,
    reading_progress_example,
    reading_notes_example,
    learning_collections_example,
    reading_paths_example,
    resource_recommendations_example,
    career_portfolios_example,
    students_extensions,
    courses_extensions,
    academies_extensions,
    SECURITY_RULES,
};
