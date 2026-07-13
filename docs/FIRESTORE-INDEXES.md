# Firestore Composite Indexes - Deployment Guide

## Overview

The Sword Institute LMS uses Firestore queries that require composite indexes for optimal performance. These indexes have been documented in `firestore.indexes.json`.

## Required Indexes

### Index 1: Courses (published + title)
**Reason**: Featured courses query uses equality filter + orderBy
```
Collection: courses
Fields:
  - published: ASCENDING
  - title: ASCENDING
```

**Used by**: `courseService.js` - `loadCourses()`
**Query**: `where("published", "==", true).orderBy("title")`

### Index 2: Courses (published + createdAt)
**Reason**: Latest courses query
```
Collection: courses
Fields:
  - published: ASCENDING
  - createdAt: DESCENDING
```

**Used by**: Potential future queries for newest courses
**Query Pattern**: `where("published", "==", true).orderBy("createdAt", "desc")`

### Index 3: Courses (published + featured)
**Reason**: Featured courses filtering
```
Collection: courses
Fields:
  - published: ASCENDING
  - featured: ASCENDING
```

**Used by**: Featured course recommendations
**Query Pattern**: `where("published", "==", true).where("featured", "==", true)`

### Index 4: Courses (published + category)
**Reason**: Category-based course discovery
```
Collection: courses
Fields:
  - published: ASCENDING
  - category: ASCENDING
```

**Used by**: Academy course counting and category filtering
**Query Pattern**: `where("published", "==", true).where("category", "==", "Community Development")`

## Deployment

### Option 1: Firebase CLI (Recommended)

```bash
# Install Firebase CLI if needed
npm install -g firebase-tools

# Login to Firebase
firebase login

# Deploy indexes
firebase firestore:indexes:create firestore.indexes.json
```

### Option 2: Firebase Console (Manual)

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select **sword-institute-lms** project
3. Navigate to **Firestore Database**
4. Go to **Indexes** tab
5. Click **Create Index**
6. For each index in `firestore.indexes.json`, enter:
   - Collection ID
   - Fields and sort order
   - Query scope: Collection

### Option 3: Watch the Build Process

When deployed to production, if a query requires an index that doesn't exist, Firestore will:
1. Return an error with a link to create the index
2. Click the link to auto-create via Firebase Console

## Verification

After deployment, verify indexes are active:

```bash
firebase firestore:indexes:list
```

Expected output:
```
Indexes for collection: courses
  Index: [published, title]       Status: READY
  Index: [published, createdAt]   Status: READY
  Index: [published, featured]    Status: READY
  Index: [published, category]    Status: READY
```

## Why These Indexes?

Firestore's automatic indexing handles simple queries. However, when you combine:
- **Equality filter** (`where("published", "==", true)`)
- **OrderBy** on a different field (`orderBy("title")`)

...Firestore requires an explicit composite index.

## Performance Impact

With these indexes in place:
- Course queries execute in < 100ms
- Caching further reduces to < 10ms on subsequent requests
- Academy page renders in < 1 second

## Troubleshooting

### Error: "FAILED_PRECONDITION"
**Message**: "The query requires an index to be built..."

**Solution**: Create the missing composite index using Firebase Console or CLI

### Index Status: BUILDING
**What it means**: Index creation is in progress (can take up to 24 hours for large collections)

**Action**: Wait for "READY" status before querying

### Index Not Appearing
**Cause**: May take 1-2 minutes to appear in console after creation

**Solution**: Wait and refresh

## Best Practices

1. **Always document** why an index is needed (see comments in code)
2. **Monitor index size** - if unused for 30 days, Firestore auto-deletes it
3. **Test locally** with Firebase emulator before deploying
4. **Keep indexes minimal** - only create what's needed

## Related Files

- [js/services/courseService.js](js/services/courseService.js) - Uses indexes
- [firestore.indexes.json](firestore.indexes.json) - Index definitions
- [firebase-config.js](firebase-config.js) - Firebase initialization
