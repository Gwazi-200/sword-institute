# Sword Knowledge Hub - Firestore Deployment Guide

**Version**: 1.0.0  
**Last Updated**: 2026-07-13  
**Status**: Ready for Deployment

---

## 📋 TABLE OF CONTENTS

1. [Prerequisites](#prerequisites)
2. [Schema Deployment](#schema-deployment)
3. [Security Rules Deployment](#security-rules-deployment)
4. [Index Creation](#index-creation)
5. [Seeding Sample Data](#seeding-sample-data)
6. [Verification](#verification)
7. [Rollback Plan](#rollback-plan)

---

## 🔧 PREREQUISITES

Before deploying, ensure you have:

- ✅ Firebase project created at [console.firebase.google.com](https://console.firebase.google.com)
- ✅ Firestore database initialized (Cloud Firestore, not Realtime Database)
- ✅ Firebase Admin SDK credentials or Web SDK configured
- ✅ Appropriate IAM permissions (Firebase Admin role minimum)
- ✅ Read through [KNOWLEDGE-HUB-SCHEMA.md](./KNOWLEDGE-HUB-SCHEMA.md)

### Verify Firebase Configuration

```javascript
// In firebase.js, verify this exists:
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_ID",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
```

---

## 📊 SCHEMA DEPLOYMENT

The Knowledge Hub schema consists of **7 new collections** and **3 collection extensions**.

### New Collections to Create

These collections will be **auto-created** when you insert the first document. However, it's good practice to understand their structure:

#### 1. knowledge_resources

**Purpose**: Centralized repository of all learning resources  
**Documents Per Collection**: 1000s (estimate)  
**Access Pattern**: Public read, admin write

**Document Structure**:
```javascript
{
  resourceId: "res_001",                    // Auto-generated ID
  slug: "intro-to-machine-learning",        // URL-friendly slug
  title: "Introduction to Machine Learning",
  description: "Comprehensive guide to ML fundamentals...",
  type: "book",                             // book|video|paper|podcast|article|template|toolkit|case-study|download
  difficulty: "beginner",                   // beginner|intermediate|advanced|expert
  estimatedTime: 180,                       // minutes
  academy: "AI Masters",
  author: "Dr. Jane Smith",
  category: "Machine Learning",
  tags: ["machine-learning", "python", "data-science"],
  rating: 4.8,                              // 0-5
  ratingCount: 245,
  views: 5230,
  downloads: 1240,
  shares: 320,
  thumbnail: "https://storage.googleapis.com/...",
  contentUrl: "https://drive.google.com/... or storage url",
  sourceUrl: "https://external-source.com",
  duration: "3 hours",
  pageCount: null,
  videoLength: null,
  language: "en",
  isPublished: true,
  isSponsored: false,
  isPremium: false,
  relatedResourceIds: ["res_002", "res_003"],
  createdAt: Timestamp,
  updatedAt: Timestamp,
  createdBy: "admin_001"
}
```

#### 2. reading_progress (Subcollection per Student)

**Path**: `reading_progress/{studentId}/resources/{resourceId}`  
**Purpose**: Track student's reading progress on each resource  
**Documents Per Student**: ~10-50 (varies)  
**Access**: User can only read/write their own

**Document Structure**:
```javascript
{
  studentId: "student_123",
  resourceId: "res_001",
  status: "in-progress",                    // not-started|in-progress|completed
  progress: 45,                             // 0-100%
  currentPage: 78,
  timeSpent: 2400,                          // seconds
  sessionCount: 5,
  notesCount: 3,
  highlightCount: 12,
  isSaved: true,
  isLiked: false,
  lastAccessedAt: Timestamp,
  completedAt: null,
  createdAt: Timestamp
}
```

#### 3. reading_notes (Subcollection per Student)

**Path**: `reading_notes/{studentId}/notes/{noteId}`  
**Purpose**: Store student's notes, highlights, and annotations  
**Documents Per Student**: ~20-500  
**Access**: User can only read/write their own

**Document Structure**:
```javascript
{
  resourceId: "res_001",
  type: "note",                             // note|highlight|question|bookmark
  content: "This is a key insight about neural networks...",
  context: "From page 45, chapter 3",
  pageNumber: 45,
  colorTag: "yellow",                       // yellow|blue|green|red|purple
  isFlagged: false,
  isShared: false,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

#### 4. learning_collections

**Purpose**: Curated bundles of courses + resources  
**Documents Per Collection**: 50-200  
**Access**: Public read, admin write

**Document Structure**:
```javascript
{
  collectionId: "col_001",
  title: "Data Science Masterclass Bundle",
  description: "Complete learning path from beginner to advanced...",
  courseIds: ["course_001", "course_002"],
  resourceIds: ["res_001", "res_002", "res_003"],
  estimatedDuration: 1200,                  // minutes
  certificateTemplate: "cert_001",
  difficulty: "intermediate",
  tags: ["data-science", "python", "analytics"],
  thumbnail: "https://...",
  createdAt: Timestamp,
  isPublished: true
}
```

#### 5. reading_paths

**Purpose**: Guided learning journeys with structured sections  
**Documents Per Collection**: 20-100  
**Access**: Public read, admin write

**Document Structure**:
```javascript
{
  pathId: "path_001",
  title: "Complete Python Developer Roadmap",
  description: "Step-by-step journey to become a Python expert...",
  academy: "AI Masters",
  difficulty: "beginner",
  estimatedDuration: 1800,                  // minutes
  sections: [
    {
      sectionId: "sec_001",
      title: "Getting Started",
      resourceIds: ["res_001", "res_002"],
      estimatedDuration: 300,
      order: 1
    },
    {
      sectionId: "sec_002",
      title: "Advanced Concepts",
      resourceIds: ["res_003", "res_004"],
      estimatedDuration: 500,
      order: 2
    }
  ],
  milestones: [
    {
      milestoneId: "mil_001",
      title: "Basics Completion",
      resourceId: "res_005",
      order: 1
    }
  ],
  createdAt: Timestamp,
  isPublished: true
}
```

#### 6. resource_recommendations (Subcollection per Student)

**Path**: `resource_recommendations/{studentId}/recommendations/{recId}`  
**Purpose**: Pre-computed personalized recommendations  
**Documents Per Student**: ~5-20  
**Access**: User reads, Cloud Functions write

**Document Structure**:
```javascript
{
  resourceId: "res_001",
  title: "Advanced ML Techniques",
  reason: "Based on your interest in Machine Learning",
  reasonType: "interest-based",             // interest-based|skill-gap|trending|similar|continuation
  relevanceScore: 0.92,                     // 0-1
  personalizationFactors: {
    skillMatch: 0.95,
    careerAlignment: 0.88,
    completionProbability: 0.78
  },
  displayOrder: 1,
  createdAt: Timestamp,
  expiresAt: Timestamp                      // 30 days from creation
}
```

#### 7. career_portfolios (Subcollection per Student)

**Path**: `career_portfolios/{studentId}/portfolio/{doc}`  
**Purpose**: Aggregated achievements and career profile  
**Documents Per Student**: 1  
**Access**: User reads, Cloud Functions write

**Document Structure**:
```javascript
{
  studentId: "student_123",
  totalXP: 5320,
  currentLevel: 8,                          // 1-99
  certificates: [
    {
      certificateId: "cert_001",
      title: "Machine Learning Specialist",
      issuedAt: Timestamp,
      expiresAt: null,
      credential: "https://credential-url.com"
    }
  ],
  badges: [
    {
      badgeId: "badge_001",
      title: "500 Minutes Read",
      category: "reading",
      unlockedAt: Timestamp
    }
  ],
  skills: [
    {
      skillId: "skill_001",
      name: "Python",
      level: "advanced",
      endorsements: 12,
      resources: ["res_001", "res_002"]
    }
  ],
  readingStats: {
    totalResourcesCompleted: 24,
    totalTimeSpent: 72000,                  // seconds
    currentStreak: 12,                      // days
    longestStreak: 45
  },
  achievements: [
    {
      title: "First Course Completed",
      unlockedAt: Timestamp,
      rarity: "common"
    }
  ],
  updatedAt: Timestamp
}
```

### Collections to Extend

#### 8. students (NEW FIELDS)

Add these fields to the `students/{studentId}` document:

```javascript
{
  // Existing fields...
  name: "John Doe",
  email: "john@example.com",
  
  // NEW FIELDS for Knowledge Hub:
  readingGoal: 300,                         // minutes per month
  readingLevel: "intermediate",             // beginner|intermediate|advanced
  preferredTopics: ["AI", "Data Science", "Python"],
  readingStreak: 12,                        // current days
  longestReadingStreak: 45,
  totalReadingTime: 72000,                  // seconds
  lastReadAt: Timestamp,
  knowledgeHubPreferences: {
    enableRecommendations: true,
    enableNotifications: true,
    preferredResourceTypes: ["video", "article", "paper"]
  }
}
```

#### 9. courses (NEW FIELDS)

Add these fields to the `courses/{courseId}` document:

```javascript
{
  // Existing fields...
  title: "Advanced Python",
  
  // NEW FIELDS for Knowledge Hub:
  relatedResources: ["res_001", "res_002", "res_003"],
  downloadableAssets: [
    {
      assetId: "asset_001",
      title: "Python Cheatsheet",
      url: "https://storage.googleapis.com/...",
      type: "pdf"
    }
  ],
  resourceBundles: ["col_001", "col_002"]
}
```

#### 10. academies (NEW FIELDS)

Add these fields to the `academies/{academyId}` document:

```javascript
{
  // Existing fields...
  name: "AI Masters Academy",
  
  // NEW FIELDS for Knowledge Hub:
  featuredResources: ["res_001", "res_002"],
  toolkits: ["toolkit_001", "toolkit_002"],
  recommendedBooks: ["res_003", "res_004", "res_005"],
  readingPaths: ["path_001", "path_002"],
  resourceCategories: ["Machine Learning", "Python", "Data Science"]
}
```

---

## 🔐 SECURITY RULES DEPLOYMENT

### Step 1: Copy Security Rules

Go to Firebase Console → Firestore → Rules tab

Replace the entire rules with:

```firestore
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Public read for knowledge_resources (published only)
    match /knowledge_resources/{document=**} {
      allow read: if resource.data.isPublished == true;
      allow write: if request.auth.token.admin == true;
    }
    
    // Learning collections - public read
    match /learning_collections/{document=**} {
      allow read: if resource.data.isPublished == true;
      allow write: if request.auth.token.admin == true;
    }
    
    // Reading paths - public read
    match /reading_paths/{document=**} {
      allow read: if resource.data.isPublished == true;
      allow write: if request.auth.token.admin == true;
    }
    
    // Reading progress - private per student
    match /reading_progress/{studentId}/resources/{resourceId} {
      allow read, write: if request.auth.uid == studentId;
    }
    
    // Reading notes - private per student
    match /reading_notes/{studentId}/notes/{noteId} {
      allow read, write: if request.auth.uid == studentId;
    }
    
    // Recommendations - private per student, CF write
    match /resource_recommendations/{studentId}/recommendations/{recId} {
      allow read: if request.auth.uid == studentId;
      allow write: if request.auth.token.admin == true;
    }
    
    // Career portfolios - private per student, CF write
    match /career_portfolios/{studentId}/portfolio/{doc=**} {
      allow read: if request.auth.uid == studentId;
      allow write: if request.auth.token.admin == true;
    }
    
    // Students extension - user reads own, admin can write
    match /students/{studentId} {
      allow read, write: if request.auth.uid == studentId || request.auth.token.admin == true;
    }
    
    // Courses extension - public read
    match /courses/{courseId} {
      allow read: if true;
      allow write: if request.auth.token.admin == true;
    }
    
    // Academies extension - public read
    match /academies/{academyId} {
      allow read: if true;
      allow write: if request.auth.token.admin == true;
    }
  }
}
```

### Step 2: Deploy Rules

Click **Publish** button in Firebase Console

✅ Rules should take effect within seconds

---

## 📑 INDEX CREATION

Firestore will automatically suggest indexes when you run queries. However, you can pre-create them:

### Recommended Composite Indexes

#### Index 1: knowledge_resources - Search
- Collection: `knowledge_resources`
- Fields: `isPublished` (Ascending), `createdAt` (Descending)
- Purpose: Fast published resource queries

#### Index 2: knowledge_resources - Type & Difficulty
- Collection: `knowledge_resources`
- Fields: `type` (Ascending), `difficulty` (Ascending), `rating` (Descending)
- Purpose: Filter by type + difficulty, sorted by rating

#### Index 3: knowledge_resources - Academy & Tags
- Collection: `knowledge_resources`
- Fields: `academy` (Ascending), `tags` (Ascending), `views` (Descending)
- Purpose: Academy resources sorted by popularity

#### Index 4: reading_progress - Status
- Collection: `reading_progress/{studentId}/resources`
- Fields: `status` (Ascending), `lastAccessedAt` (Descending)
- Purpose: Get in-progress resources

#### Index 5: reading_progress - Completed
- Collection: `reading_progress/{studentId}/resources`
- Fields: `status` (Ascending), `completedAt` (Descending)
- Purpose: Get completed resources

### How to Create Indexes in Firebase Console

1. Go to **Firestore** → **Indexes** tab
2. Click **Create Index**
3. Select collection
4. Add fields in order
5. Click **Create**

Alternatively, indexes are auto-created when you run queries with multiple filters.

---

## 🌱 SEEDING SAMPLE DATA

### Step 1: Navigate to Seed Page

Open `seed.html` in your browser (usually at `http://localhost:5000/seed.html`)

### Step 2: Run Resource Seeder

Click the button **"Seed Knowledge Hub Resources"**

This will:
- Generate 50+ sample resources across multiple academies
- Distribute across types (books, videos, papers, podcasts, articles)
- Set various difficulty levels and time estimates
- Add realistic tags and categories
- Create in Firestore `knowledge_resources` collection

**Expected Time**: 2-3 minutes (batch uploads)

### Step 3: Verify in Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Navigate to **Firestore** → **Data**
4. Look for `knowledge_resources` collection
5. You should see 50+ documents

---

## ✅ VERIFICATION

### Verify in Firebase Console

```
Firestore Collections Checklist:
✅ knowledge_resources - 50+ documents
✅ Students have new fields: readingLevel, preferredTopics, readingStreak
✅ Courses have new fields: relatedResources, downloadableAssets
✅ Academies have new fields: featuredResources, toolkits
```

### Verify Services Work

Open browser console and test:

```javascript
// Import the service
import { loadResources, searchResources } from "./js/services/resourceService.js";

// Load all resources (will cache for 5 minutes)
const resources = await loadResources();
console.log("Found resources:", resources.length);

// Search for resources
const results = await searchResources({ query: "machine learning" });
console.log("Search results:", results.length);

// Filter by difficulty
const advanced = await searchResources({ 
  filters: { difficulty: "advanced" } 
});
console.log("Advanced resources:", advanced.length);
```

### Test Reading Progress

```javascript
import { startReading, updateProgress } from "./js/services/readingProgressService.js";

// Start reading
await startReading("student_123", "res_001");

// Update progress
await updateProgress("student_123", "res_001", { progress: 50, timeSpent: 1200 });

// Get progress
const progress = await getProgress("student_123", "res_001");
console.log("Progress:", progress);
```

### Test Bookmarking

```javascript
import { saveResource, likeResource } from "./js/services/bookmarkService.js";

// Save a resource
await saveResource("student_123", "res_001");

// Like a resource
await likeResource("student_123", "res_001");

// Get all bookmarks
const bookmarks = await getAllBookmarks("student_123");
console.log("Saved:", bookmarks.saved.length);
console.log("Liked:", bookmarks.liked.length);
```

---

## 🔄 ROLLBACK PLAN

If something goes wrong:

### Option 1: Delete Collection

1. Go to Firebase Console → Firestore → Data
2. Right-click `knowledge_resources` collection
3. Click **Delete collection**
4. Re-run seeding

### Option 2: Reset Specific Documents

```javascript
// Delete all in a collection
const querySnapshot = await getDocs(collection(db, "knowledge_resources"));
querySnapshot.forEach((doc) => {
  deleteDoc(doc.ref);
});
```

### Option 3: Restore Security Rules

If security rules break something:

1. Go to Firestore → Rules
2. Replace with previous working version
3. Click Publish

---

## 📞 TROUBLESHOOTING

### Problem: "Permission denied" error

**Solution**: Check that:
1. You're logged in with Firebase admin user
2. Security rules are deployed correctly
3. Firestore is initialized in firebase.js

### Problem: Seeding hangs or times out

**Solution**:
1. Reduce batch size in seeder
2. Check browser console for errors
3. Verify Firestore quota not exceeded

### Problem: Can't find resources in service

**Solution**:
1. Make sure `knowledge_resources` collection exists
2. Check that documents have `isPublished: true`
3. Clear browser cache and reload
4. Check browser console for Firebase errors

### Problem: Indexes missing

**Solution**:
1. Run a query that needs the index
2. Firebase will suggest creating it
3. Click suggestion link to create
4. Indexes take 5-10 minutes to build

---

## ✨ NEXT STEPS

After deployment and seeding:

1. ✅ **Verify data** in Firebase Console
2. ✅ **Test services** in browser console
3. ➡️ **Create UI components** (SearchBar, FilterPanel, ResourceGrid)
4. ➡️ **Build Knowledge Hub page** combining all components
5. ➡️ **Add personalization** with recommendation engine

---

## 📚 RESOURCES

- [Firestore Documentation](https://firebase.google.com/docs/firestore)
- [Security Rules Guide](https://firebase.google.com/docs/firestore/security/start)
- [Create Composite Indexes](https://firebase.google.com/docs/firestore/query-data/index-overview)
- [KNOWLEDGE-HUB-SCHEMA.md](./KNOWLEDGE-HUB-SCHEMA.md) — Complete schema reference
- [KNOWLEDGE-HUB-IMPLEMENTATION-PLAN.md](./KNOWLEDGE-HUB-IMPLEMENTATION-PLAN.md) — Full implementation plan

