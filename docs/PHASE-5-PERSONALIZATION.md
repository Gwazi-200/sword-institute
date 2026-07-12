# Phase 5: Personalization Services - Complete Guide

**Version**: 1.0.0  
**Status**: ✅ Production Ready  
**Last Updated**: 2026-07-13

---

## 📦 SERVICES OVERVIEW

| Service | Purpose | Functions | Status |
|---------|---------|-----------|--------|
| **recommendationService.js** | AI-powered suggestions | 6 functions | ✅ |
| **careerPortfolioService.js** | Achievement tracking | 8 functions | ✅ |
| **learningCollectionService.js** | Resource bundles | 11 functions | ✅ |
| **readingPathService.js** | Guided journeys | 11 functions | ✅ |

**Total**: 1,530 lines of production-ready code

---

## 🔍 1. RECOMMENDATION SERVICE

**File**: `js/services/recommendationService.js`

### Purpose
Intelligent recommendation engine that suggests resources based on:
- Student reading history
- Skill level progression
- Popular resources (trending)
- Similar resource discovery
- Skill-based learning

### Core Functions

#### `getRecommendations(studentId, limit=10)`
Get personalized recommendations for a student.

```javascript
import { getRecommendations } from "./js/services/recommendationService.js";

// Get top 10 personalized recommendations
const recs = await getRecommendations("student_123");

console.log(recs[0]);
// {
//   resourceId: "res_001",
//   title: "Advanced Python Patterns",
//   type: "book",
//   reason: "Similar to your books • Next-level challenge",
//   score: 87.5,
//   relevance: 0.875
// }
```

**Algorithm**: Multi-factor scoring
- Type matching (30%): Similar to resources already read
- Rating (25%): Higher-rated resources scored higher
- Popularity (20%): Number of views
- Difficulty (15%): Appropriate challenge level
- Academy diversity (10%): Explore new academies

#### `getTrendingResourcesRecommendations(limit=10)`
Get popular resources across all students.

```javascript
const trending = await getTrendingResourcesRecommendations(5);
// Returns most viewed/bookmarked resources
```

#### `getSimilarResources(resourceId, limit=5)`
Find resources similar to a given one.

```javascript
const similar = await getSimilarResources("res_001");
// Returns resources with:
// - Same type (40 pts)
// - Same difficulty (25 pts)
// - Same academy (25 pts)
// - Shared tags (5 pts each)
```

#### `getSkillBasedRecommendations(studentId, skillName, limit=8)`
Get resources for learning a specific skill.

```javascript
const pythonResources = await getSkillBasedRecommendations(
    "student_123",
    "Python"
);
// Returns all resources mentioning "Python" in title/tags
```

#### `getAcademyRecommendations(studentId, academy, limit=6)`
Get featured resources from an academy.

```javascript
const aiResources = await getAcademyRecommendations(
    "student_123",
    "AI Masters"
);
```

#### `getDifficultyBasedRecommendations(studentId, limit=8)`
Get appropriately-leveled resources with slight challenge.

```javascript
const nextLevel = await getDifficultyBasedRecommendations("student_123");
// Returns resources at current level and next level
```

### Cache Management

```javascript
import { 
    clearRecommendationCache, 
    getRecommendationCacheStatus 
} from "./js/services/recommendationService.js";

// Check cache stats
const stats = getRecommendationCacheStatus();
console.log(stats);
// {
//   personalRecsCount: 45,
//   trendingRecsCached: true,
//   similarResourcesCount: 120,
//   skillBasedRecsCount: 30,
//   cacheSize: 152000
// }

// Clear cache
clearRecommendationCache();
```

---

## 🏆 2. CAREER PORTFOLIO SERVICE

**File**: `js/services/careerPortfolioService.js`

### Purpose
Comprehensive career development tracking including:
- Completed resources
- Certificates earned
- Skills acquired
- Achievements/badges
- Learning statistics

### Core Functions

#### `getCareerPortfolio(studentId)`
Get complete portfolio with all achievements.

```javascript
import { getCareerPortfolio } from "./js/services/careerPortfolioService.js";

const portfolio = await getCareerPortfolio("student_123");

console.log(portfolio);
// {
//   studentId: "student_123",
//   name: "John Doe",
//   completedResources: [...],
//   certificates: [...],
//   skills: [...],
//   achievements: [...],
//   stats: {
//     totalCompleted: 15,
//     totalCertificates: 3,
//     totalSkills: 8,
//     totalAchievements: 6,
//     totalLearningHours: 42.5,
//     completionRate: 88
//   },
//   joinedDate: Date,
//   lastUpdated: Date
// }
```

#### `getCompletedResources(studentId, options={})`
Get resources student has finished.

```javascript
// Get all completed resources
const all = await getCompletedResources("student_123");

// Filter by academy
const aiResources = await getCompletedResources("student_123", {
    academy: "AI Masters"
});

// Filter by type
const videos = await getCompletedResources("student_123", {
    type: "video"
});

// Sort by recent completion
const recent = await getCompletedResources("student_123", {
    sortBy: "recent"
});

// Sort by rating
const topRated = await getCompletedResources("student_123", {
    sortBy: "rating"
});
```

#### `getEarnedCertificates(studentId)`
Get all certificates earned.

```javascript
const certs = await getEarnedCertificates("student_123");
// [
//   {
//     certificateId: "cert_001",
//     title: "AI Fundamentals Certificate",
//     issuedDate: Date,
//     expiryDate: Date,
//     url: "https://..."
//   },
//   ...
// ]
```

#### `getAcquiredSkills(studentId)`
Get skills with proficiency levels.

```javascript
const skills = await getAcquiredSkills("student_123");
// [
//   { skillName: "Python", proficiency: "advanced", resources: 8 },
//   { skillName: "Machine Learning", proficiency: "intermediate", resources: 5 },
//   { skillName: "Data Analysis", proficiency: "beginner", resources: 2 }
// ]
```

#### `getAchievements(studentId)`
Get earned badges/achievements.

```javascript
const achievements = await getAchievements("student_123");
// [
//   { id: "first_resource", name: "Curious Mind", icon: "🎓" },
//   { id: "five_resources", name: "Learning Enthusiast", icon: "📚" },
//   { id: "100_hours", name: "Dedicated Learner", icon: "🔥" },
//   ...
// ]
```

#### `addCompletedResource(studentId, resource)`
Mark resource as completed and add to portfolio.

```javascript
import { addCompletedResource } from "./js/services/careerPortfolioService.js";

await addCompletedResource("student_123", {
    resourceId: "res_001",
    title: "Python Crash Course",
    type: "book",
    academy: "AI Masters",
    completedDate: new Date(),
    timeSpent: 3600, // seconds
    rating: 5
});

// Automatically checks for achievements
// (first resource, milestones, etc.)
```

#### `awardCertificate(studentId, certificate)`
Award a certificate to student.

```javascript
await awardCertificate("student_123", {
    certificateId: "cert_001",
    title: "AI Fundamentals Certificate",
    issuedDate: new Date(),
    expiryDate: new Date(Date.now() + 365*24*60*60*1000),
    url: "https://example.com/certificates/cert_001"
});
```

#### `addSkill(studentId, skill)` and `awardAchievement(studentId, achievement)`
Add skills and award achievements similarly.

```javascript
// Add skill
await addSkill("student_123", {
    skillName: "Python",
    category: "Programming",
    resources: 5
});

// Award achievement
await awardAchievement("student_123", {
    id: "first_resource",
    name: "Curious Mind",
    icon: "🎓",
    description: "Completed your first resource"
});
```

### Automatic Achievements

The service automatically awards achievements when conditions are met:

| Achievement | Condition | Badge |
|-------------|-----------|-------|
| Curious Mind | Complete 1 resource | 🎓 |
| Learning Enthusiast | Complete 5 resources | 📚 |
| Dedicated Scholar | Complete 10 resources | 🔬 |
| Certified Expert | Earn 1 certificate | 🏆 |
| Multi-Skilled | Acquire 5 skills | 🎯 |
| Dedicated Learner | 100+ hours learning | 🔥 |

---

## 📚 3. LEARNING COLLECTION SERVICE

**File**: `js/services/learningCollectionService.js`

### Purpose
Manage curated and personal learning collections (resource bundles).

### Core Functions

#### `getLearningCollections(options={})`
Get all learning collections (curated or by type).

```javascript
import { getLearningCollections } from "./js/services/learningCollectionService.js";

// Get all public collections
const all = await getLearningCollections();

// Get by type
const curated = await getLearningCollections({ type: "curated" });
const personal = await getLearningCollections({ type: "personal" });

// Get with limit
const featured = await getLearningCollections({ limit: 10 });
```

#### `getCollectionById(collectionId)`
Get collection details.

```javascript
const collection = await getCollectionById("coll_001");
// {
//   id: "coll_001",
//   title: "AI Fundamentals Path",
//   description: "Complete guide to AI basics",
//   resources: [...],
//   createdBy: "admin_001",
//   enrollments: 1250,
//   type: "curated",
//   isPublished: true
// }
```

#### `getCollectionResources(collectionId, options={})`
Get resources in collection with ordering.

```javascript
// Get resources in order
const resources = await getCollectionResources("coll_001");
// [
//   { resourceId: "res_001", title: "...", order: 1 },
//   { resourceId: "res_002", title: "...", order: 2 },
//   ...
// ]

// Sort by recent
const recent = await getCollectionResources("coll_001", {
    sortBy: "recent"
});
```

#### `getStudentCollections(studentId)`
Get collections created by student.

```javascript
const myCollections = await getStudentCollections("student_123");
```

#### `createCollection(studentId, collectionData)`
Create a new collection.

```javascript
const collectionId = await createCollection("student_123", {
    title: "My AI Learning Path",
    description: "Curated resources for learning AI",
    type: "personal",
    isPublished: false // Share later
});

console.log(collectionId); // "coll_newid123"
```

#### `addResourceToCollection(collectionId, resource)`
Add resource to collection.

```javascript
await addResourceToCollection("coll_001", {
    resourceId: "res_001",
    title: "Python Basics",
    order: 1
});
```

#### `removeResourceFromCollection(collectionId, resourceId)`
Remove resource from collection.

```javascript
await removeResourceFromCollection("coll_001", "res_001");
```

#### `searchCollections(query, options={})`
Search collections by title/description.

```javascript
const results = await searchCollections("Python", { limit: 10 });
// Returns collections with "Python" in title or description
```

#### `getPopularCollections(limit=10)`
Get most popular collections by enrollments.

```javascript
const popular = await getPopularCollections(5);
```

#### `enrollInCollection(studentId, collectionId)`
Student enrolls in a collection.

```javascript
await enrollInCollection("student_123", "coll_001");
```

---

## 🛤️ 4. READING PATH SERVICE

**File**: `js/services/readingPathService.js`

### Purpose
Manage guided learning journeys with sequential resources and progress tracking.

### Core Functions

#### `getReadingPaths(options={})`
Get all reading paths with optional filtering.

```javascript
import { getReadingPaths } from "./js/services/readingPathService.js";

// Get all paths
const all = await getReadingPaths();

// Filter by difficulty
const beginner = await getReadingPaths({ difficulty: "beginner" });
const advanced = await getReadingPaths({ difficulty: "advanced" });

// Get featured paths
const featured = await getReadingPaths({ limit: 6 });
```

#### `getPathById(pathId)`
Get path details.

```javascript
const path = await getPathById("path_001");
// {
//   id: "path_001",
//   title: "AI Fundamentals",
//   description: "Learn AI from basics to advanced",
//   difficulty: "beginner",
//   estimatedTime: 40, // hours
//   resources: [...],
//   milestones: [...],
//   enrollments: 5420
// }
```

#### `getPathResources(pathId)`
Get ordered resources in path.

```javascript
const resources = await getPathResources("path_001");
// [
//   {
//     resourceId: "res_001",
//     title: "AI Basics",
//     order: 1,
//     estimatedTime: 4,
//     required: true
//   },
//   {
//     resourceId: "res_002",
//     title: "Neural Networks",
//     order: 2,
//     estimatedTime: 6,
//     required: true
//   },
//   ...
// ]
```

#### `enrollInPath(studentId, pathId)`
Enroll student in learning path.

```javascript
const enrollmentId = await enrollInPath("student_123", "path_001");
```

#### `getPathProgress(studentId, pathId)`
Get student's progress in path.

```javascript
const progress = await getPathProgress("student_123", "path_001");
// {
//   progress: 45, // percentage
//   completedResources: ["res_001", "res_002"],
//   milestones: [
//     { threshold: 25, name: "Quarter Way", icon: "🎯" },
//     { threshold: 50, name: "Halfway", icon: "🌟" }
//   ],
//   estimatedCompletion: Date,
//   status: "active"
// }
```

#### `updatePathProgress(studentId, pathId, updates)`
Update progress (called automatically).

```javascript
await updatePathProgress("student_123", "path_001", {
    progress: 50,
    completedResources: ["res_001", "res_002"]
});
```

#### `completePathResource(studentId, pathId, resourceId)`
Mark a resource complete in the path.

```javascript
await completePathResource("student_123", "path_001", "res_001");
// Automatically:
// - Updates completed resources
// - Recalculates progress percentage
// - Checks for milestones
// - Updates status if path complete
```

#### `getNextResource(studentId, pathId)`
Get the next resource to complete.

```javascript
const next = await getNextResource("student_123", "path_001");
// {
//   resourceId: "res_003",
//   title: "Deep Learning",
//   order: 3
// }
```

#### `getFeaturedPaths(limit=6)`
Get most popular paths.

```javascript
const featured = await getFeaturedPaths(5);
```

#### `getPathsByDifficulty(difficulty)`
Get paths filtered by difficulty.

```javascript
const intermediate = await getPathsByDifficulty("intermediate");
```

---

## 🗄️ FIRESTORE SCHEMA UPDATES

Add these new collections to Firestore:

### 1. `learning_collections`
```javascript
{
  id: "coll_001",
  title: "AI Fundamentals",
  description: "Complete guide to AI",
  type: "curated", // or "personal"
  createdBy: "admin_001",
  resources: [
    { resourceId: "res_001", title: "...", order: 1 }
  ],
  enrollments: 150,
  isPublished: true,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### 2. `reading_paths`
```javascript
{
  id: "path_001",
  title: "AI Fundamentals",
  description: "Learn AI from basics",
  difficulty: "beginner",
  estimatedTime: 40, // hours
  resources: [
    { resourceId: "res_001", order: 1, estimatedTime: 4, required: true }
  ],
  milestones: [
    { threshold: 25, name: "Quarter Way" },
    { threshold: 50, name: "Halfway" },
    { threshold: 75, name: "Almost There" },
    { threshold: 100, name: "Complete" }
  ],
  enrollments: 5420,
  createdAt: Timestamp
}
```

### 3. `reading_paths/{pathId}/enrollments`
```javascript
{
  studentId: "student_123",
  pathId: "path_001",
  enrolledDate: Timestamp,
  progress: 45,
  completedResources: ["res_001", "res_002"],
  milestones: [
    { threshold: 25, name: "Quarter Way", achievedDate: Date }
  ],
  status: "active", // or "completed"
  lastUpdated: Timestamp
}
```

### 4. `career_portfolios`
```javascript
{
  studentId: "student_123",
  completedResources: [
    { resourceId, title, type, academy, completedDate, timeSpent }
  ],
  certificates: [
    { certificateId, title, issuedDate, expiryDate, url }
  ],
  skills: [
    { skillName, category, resources, acquiredDate }
  ],
  achievements: [
    { id, name, icon, description, awardedDate }
  ],
  createdDate: Timestamp,
  lastUpdated: Timestamp
}
```

---

## 📊 INTEGRATION EXAMPLES

### Example 1: Recommendation Widget

```html
<!-- HTML -->
<div id="recommendations"></div>

<script type="module">
import { getRecommendations } from "./js/services/recommendationService.js";

async function loadRecommendations() {
    const recs = await getRecommendations("student_123", 6);
    
    const html = recs.map(rec => `
        <div class="rec-card">
            <h3>${rec.title}</h3>
            <p>${rec.reason}</p>
            <div class="relevance-bar">
                <div style="width: ${rec.relevance * 100}%"></div>
            </div>
        </div>
    `).join("");
    
    document.querySelector("#recommendations").innerHTML = html;
}

loadRecommendations();
</script>
```

### Example 2: Career Portfolio Display

```javascript
import { getCareerPortfolio } from "./js/services/careerPortfolioService.js";

async function displayPortfolio() {
    const portfolio = await getCareerPortfolio("student_123");
    
    console.log("📊 Career Stats:");
    console.log(`  Resources Completed: ${portfolio.stats.totalCompleted}`);
    console.log(`  Learning Hours: ${portfolio.stats.totalLearningHours}`);
    console.log(`  Certificates: ${portfolio.stats.totalCertificates}`);
    console.log(`  Skills: ${portfolio.stats.totalSkills}`);
    console.log(`  Achievements: ${portfolio.stats.totalAchievements}`);
    console.log(`  Completion Rate: ${portfolio.stats.completionRate}%`);
    
    // Render achievements
    const achievements = portfolio.achievements;
    achievements.forEach(badge => {
        console.log(`${badge.icon} ${badge.name}`);
    });
}

displayPortfolio();
```

### Example 3: Reading Path Enrollment

```javascript
import { 
    enrollInPath, 
    getPathProgress, 
    completePathResource,
    getNextResource 
} from "./js/services/readingPathService.js";

async function startLearningPath() {
    const pathId = "path_001";
    const studentId = "student_123";
    
    // Enroll
    await enrollInPath(studentId, pathId);
    
    // Get progress
    const progress = await getPathProgress(studentId, pathId);
    console.log(`Progress: ${progress.progress}%`);
    
    // Complete a resource
    await completePathResource(studentId, pathId, "res_001");
    
    // Get next one
    const next = await getNextResource(studentId, pathId);
    console.log(`Next: ${next.title}`);
}
```

### Example 4: Learning Collection

```javascript
import { 
    createCollection, 
    addResourceToCollection,
    getCollectionResources
} from "./js/services/learningCollectionService.js";

async function createMyLearningBundle() {
    // Create collection
    const collId = await createCollection("student_123", {
        title: "My Python Journey",
        description: "Resources I'm using to learn Python",
        type: "personal"
    });
    
    // Add resources
    await addResourceToCollection(collId, {
        resourceId: "res_001",
        title: "Python Basics",
        order: 1
    });
    
    await addResourceToCollection(collId, {
        resourceId: "res_002",
        title: "Advanced Python",
        order: 2
    });
    
    // Get collection
    const resources = await getCollectionResources(collId);
    console.log(`Collection has ${resources.length} resources`);
}
```

---

## 🚀 RECOMMENDED NEXT STEPS

1. **Deploy Services**: Push code to production
2. **Create Seed Data**: Add sample paths and collections
3. **Build UI Widgets**:
   - Recommendation cards
   - Portfolio display
   - Path progress tracker
   - Collection browser
4. **Integrate with Dashboard**: Add personalization widgets
5. **Enable Achievements**: Set up automatic milestone tracking

---

## 📞 SUPPORT

**Cache Issues**: Call `clearRecommendationCache()`, `clearPortfolioCache()`, etc.

**Performance**: Services use intelligent caching (5-10 min TTL)

**Analytics**: All service calls can be logged for tracking

---

**Phase 5 Complete! ✅**

Next: Phase 6 - Extend existing pages with Knowledge Hub features

