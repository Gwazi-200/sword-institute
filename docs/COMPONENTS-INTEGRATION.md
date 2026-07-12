# Knowledge Hub UI Components - Integration Guide

**Version**: 1.0.0  
**Last Updated**: 2026-07-13

---

## 📚 COMPONENTS OVERVIEW

| Component | Purpose | Lines | Status |
|-----------|---------|-------|--------|
| **ResourceCard** | Single resource display | 250 | ✅ Ready |
| **ResourceGrid** | Grid container for cards | 280 | ✅ Ready |
| **SearchBar** | Search input | 180 | ✅ Ready |
| **FilterPanel** | Multi-dimensional filters | 350 | ✅ Ready |
| **ContinueReading** | Dashboard widget | 280 | ✅ Ready |

**Total**: 1,340 lines of production-ready code

---

## 🎯 QUICK START EXAMPLE

### Minimal Knowledge Hub Page

```html
<!DOCTYPE html>
<html>
<head>
    <title>Knowledge Hub</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto;
            max-width: 1400px;
            margin: 0 auto;
            padding: 20px;
            background: #f5f5f5;
        }

        .hub-container {
            display: grid;
            grid-template-columns: 1fr 4fr;
            gap: 20px;
        }

        .sidebar {
            position: sticky;
            top: 20px;
            height: fit-content;
        }

        .main {
            display: flex;
            flex-direction: column;
            gap: 20px;
        }

        @media (max-width: 1024px) {
            .hub-container {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>

<body>
    <h1>📚 Knowledge Hub</h1>

    <div class="hub-container">
        <!-- Sidebar: Filters -->
        <aside class="sidebar">
            <filter-panel id="filters"></filter-panel>
        </aside>

        <!-- Main: Search + Grid -->
        <main class="main">
            <search-bar id="search" placeholder="Search 50+ resources..."></search-bar>
            <resource-grid id="grid" data-student-id="student_123" data-page-size="12"></resource-grid>
        </main>
    </div>

    <!-- Scripts -->
    <script type="module">
        import { loadResources, searchResources } from "./js/services/resourceService.js";
        import "./js/components/SearchBar.js";
        import "./js/components/FilterPanel.js";
        import "./js/components/ResourceGrid.js";
        import "./js/components/ResourceCard.js";

        const search = document.querySelector("#search");
        const filters = document.querySelector("#filters");
        const grid = document.querySelector("#grid");

        let allResources = [];

        // Load all resources on page load
        async function loadPage() {
            allResources = await loadResources();
            grid.setResources(allResources);
        }

        // Search
        search.addEventListener("search", async e => {
            const query = e.detail.query;
            const activeFilters = filters.getActiveFilters();

            const results = await searchResources({
                query,
                filters: activeFilters,
            });

            grid.setResources(results);
        });

        // Filter
        filters.addEventListener("filters-changed", async e => {
            const query = search.getValue();
            const activeFilters = e.detail.filters;

            const results = await searchResources({
                query,
                filters: activeFilters,
            });

            grid.setResources(results);
        });

        // View resource
        grid.addEventListener("resource-view", e => {
            console.log("View resource:", e.detail);
            // Navigate to detail page or open modal
        });

        // Initialize
        loadPage();
    </script>
</body>

</html>
```

---

## 🧩 COMPONENT API REFERENCE

### 1️⃣ ResourceCard

**HTML:**
```html
<resource-card 
    data-resource-id="res_001"
    data-student-id="student_123">
</resource-card>
```

**Events:**
```javascript
card.addEventListener("resource-view", (e) => {
    console.log(e.detail.resourceId);  // "res_001"
    console.log(e.detail.resource);    // Full resource object
});

card.addEventListener("resource-saved", (e) => {
    console.log(e.detail.isSaved);     // true/false
});

card.addEventListener("resource-liked", (e) => {
    console.log(e.detail.isLiked);     // true/false
});
```

**Properties:**
```javascript
// Read-only
card.resource;    // Full resource data
card.studentId;   // Student ID
card.isSaved;     // Boolean
card.isLiked;     // Boolean
```

---

### 2️⃣ ResourceGrid

**HTML:**
```html
<resource-grid 
    id="grid"
    data-student-id="student_123"
    data-page-size="12">
</resource-grid>
```

**Methods:**
```javascript
const grid = document.querySelector("resource-grid");

// Set resources
grid.setResources(resources);

// Add resources (append)
grid.addResources(moreResources);

// Clear resources
grid.clearResources();

// Navigation
grid.goToPreviousPage();
grid.goToNextPage();
grid.setPageSize(20);

// Get info
const info = grid.getPageInfo();
console.log(info.currentPage);   // 1
console.log(info.totalPages);    // 5
console.log(info.totalResources); // 50
```

**Events:**
```javascript
grid.addEventListener("resource-view", (e) => {
    console.log(e.detail.resourceId);
});

grid.addEventListener("resource-saved", (e) => {
    console.log(e.detail.isSaved);
});

grid.addEventListener("resource-liked", (e) => {
    console.log(e.detail.isLiked);
});
```

---

### 3️⃣ SearchBar

**HTML:**
```html
<search-bar 
    id="search"
    placeholder="Search resources...">
</search-bar>
```

**Methods:**
```javascript
const search = document.querySelector("search-bar");

// Get/set value
const query = search.getValue();
search.setValue("python");

// Clear
search.clear();

// Focus
search.focus();

// Debounce delay
search.setDebounceDelay(500);  // ms
```

**Events:**
```javascript
search.addEventListener("search", (e) => {
    console.log(e.detail.query);  // "machine learning"
});
```

**Keyboard Shortcuts:**
```
Cmd/Ctrl + K  → Focus search
Enter         → Perform search
```

---

### 4️⃣ FilterPanel

**HTML:**
```html
<filter-panel id="filters"></filter-panel>
```

**Methods:**
```javascript
const filters = document.querySelector("filter-panel");

// Get active filters
const active = filters.getActiveFilters();
console.log(active);
// {
//   academy: "AI Masters",
//   types: ["video", "book"],
//   difficulty: "beginner",
//   minRating: 4.0
// }

// Clear filters
filters.clearFilters();

// Apply filters
filters.applyFilters();

// Set filters programmatically
filters.setFilters({
    academy: "Data Science Hub",
    difficulty: "advanced"
});
```

**Events:**
```javascript
// Fires on every change
filters.addEventListener("filters-changed", (e) => {
    console.log(e.detail.filters);
});

// Fires on apply button
filters.addEventListener("filters-applied", (e) => {
    console.log(e.detail.filters);
});
```

**Filter Object:**
```javascript
{
    academy: null | "AI Masters" | "Data Science Hub" | etc,
    types: [] | ["book", "video", "paper", ...],
    difficulty: null | "beginner" | "intermediate" | "advanced" | "expert",
    minRating: 0 | 0.5 | 1.0 | 1.5 | ... | 5.0
}
```

---

### 5️⃣ ContinueReading

**HTML:**
```html
<continue-reading 
    data-student-id="student_123"
    data-limit="5">
</continue-reading>
```

**Methods:**
```javascript
const widget = document.querySelector("continue-reading");

// Refresh data
widget.refresh();
```

**Events:**
```javascript
widget.addEventListener("resource-resume", (e) => {
    console.log(e.detail.resourceId);
    console.log(e.detail.resource);
});
```

**Data Returned:**
```javascript
{
    resourceId: "res_001",
    title: "Resource Title",
    progress: 45,           // 0-100%
    timeSpent: 2400,        // seconds
    lastAccessedAt: Timestamp,
    ...
}
```

---

## 🎨 STYLING & CUSTOMIZATION

### CSS Variables (Component Level)

Each component uses CSS variables that can be overridden:

```css
resource-card {
    --primary: #667eea;
    --danger: #ff6b6b;
    --success: #51cf66;
    --text: #333;
    --text-light: #666;
    --border: #e9ecef;
    --bg-light: #f8f9fa;
}

filter-panel {
    --primary: #667eea;
    --text: #333;
    --text-light: #666;
}
```

### Override Example

```css
/* Make cards larger */
resource-card {
    --thumbnail-height: 200px;
}

/* Change primary color */
filter-panel {
    --primary: #764ba2;
}
```

---

## 📱 RESPONSIVE BEHAVIOR

### Breakpoints

All components are fully responsive:

- **Desktop** (> 1024px): Full features, optimized layouts
- **Tablet** (768px - 1024px): Adjusted spacing, single column layouts
- **Mobile** (< 768px): Optimized for touch, full-width cards

### Grid Columns

| Screen | Columns | Card Width |
|--------|---------|-----------|
| Desktop | 4 columns | 250px |
| Tablet | 2-3 columns | 200px |
| Mobile | 1 column | Full width |

---

## 🔧 ADVANCED INTEGRATION

### With Dashboard

```javascript
// Add to existing dashboard
const dashboard = document.querySelector("#dashboard");

const continueReading = document.createElement("continue-reading");
continueReading.setAttribute("data-student-id", currentStudentId);
continueReading.setAttribute("data-limit", "5");

dashboard.appendChild(continueReading);

// Listen for resume events
continueReading.addEventListener("resource-resume", (e) => {
    // Navigate to resource detail page
    window.location.href = `/knowledge-hub/resource/${e.detail.resourceId}`;
});
```

### With Course Pages

```javascript
// Show related resources on course page
import { searchResources } from "./js/services/resourceService.js";

const courseId = getCourseIdFromPage();
const relatedResources = await searchResources({
    filters: { courseId },
    pageSize: 6
});

const grid = document.querySelector("resource-grid");
grid.setResources(relatedResources);
```

### With AI Recommendations

```javascript
import { getRecommendations } from "./js/services/recommendationService.js";

const recommendations = await getRecommendations(studentId);

const grid = document.querySelector("resource-grid");
grid.setResources(recommendations);
```

---

## ✅ EVENT FLOW DIAGRAM

```
┌─────────────┐
│ SearchBar   │──search event──┐
└─────────────┘                │
                                ├──→ JavaScript Handler
┌─────────────┐                │
│ FilterPanel │──filters-changed──┤
└─────────────┘                │
                                ├──→ searchResources()
                                │
                        ┌──────┴─────┐
                        │             │
                        ▼             ▼
                   Grid.setResources()
                        │
                        └──────────┬──────────┐
                                   │          │
                            ResourceCard   ResourceCard
                          (resource-view) (resource-view)
                                   │          │
                                   └──────────┤
                                              ▼
                                      Detail Page / Modal
```

---

## 🚀 PERFORMANCE TIPS

### 1. Lazy Load Components

```javascript
// Only load SearchBar when needed
if (showSearch) {
    import("./js/components/SearchBar.js");
}
```

### 2. Limit Page Size

```html
<!-- Show 12 per page instead of all -->
<resource-grid 
    data-student-id="student_123"
    data-page-size="12">
</resource-grid>
```

### 3. Cache Resources

```javascript
// Services handle caching automatically (5 min)
// But you can force refresh:
const resources = await loadResources(true);  // Force refresh
```

### 4. Debounce Search

```javascript
const search = document.querySelector("search-bar");
search.setDebounceDelay(500);  // Wait 500ms after typing stops
```

---

## 🔗 COMPONENT DEPENDENCIES

```
ResourceCard
├── resourceService.js (getResourceById)
├── bookmarkService.js (isSaved, isLiked, toggleSave, toggleLike)
└── resourceNormalizer.js (formatResourceTime, getThumbnailURL)

ResourceGrid
├── ResourceCard (uses internally)
└── Events: resource-view, resource-saved, resource-liked

SearchBar
└── No service dependencies (emits search events)

FilterPanel
├── searchHelpers.js (getTypeLabels, getDifficultyLabels)
└── Events: filters-changed, filters-applied

ContinueReading
├── readingProgressService.js (getContinueReading)
└── resourceNormalizer.js (formatResourceTime, getTypeDisplayName)
```

---

## 📋 COMMON PATTERNS

### Pattern 1: Search + Filter + Grid

```javascript
const search = document.querySelector("search-bar");
const filters = document.querySelector("filter-panel");
const grid = document.querySelector("resource-grid");

async function performSearch() {
    const results = await searchResources({
        query: search.getValue(),
        filters: filters.getActiveFilters()
    });
    grid.setResources(results);
}

search.addEventListener("search", performSearch);
filters.addEventListener("filters-changed", performSearch);
```

### Pattern 2: Detail View Modal

```javascript
grid.addEventListener("resource-view", async (e) => {
    const { resourceId, resource } = e.detail;
    
    // Show modal with resource details
    showResourceModal({
        resource,
        studentId: currentStudentId,
        onSave: () => grid.dispatchEvent(new CustomEvent("refresh"))
    });
});
```

### Pattern 3: Multi-Section Page

```html
<section class="continue-reading-section">
    <h2>Continue Reading</h2>
    <continue-reading data-student-id="student_123"></continue-reading>
</section>

<section class="browse-section">
    <h2>Browse Resources</h2>
    <search-bar id="search"></search-bar>
    <resource-grid id="grid" data-student-id="student_123"></resource-grid>
</section>

<section class="filter-section">
    <h2>Filters</h2>
    <filter-panel id="filters"></filter-panel>
</section>
```

---

## 🎯 NEXT STEPS

1. ✅ Components created
2. → Build Knowledge Hub discovery page (full integration)
3. → Add to Dashboard as widgets
4. → Integrate with Course pages
5. → Add personalization recommendations

---

## 📚 RESOURCES

- [Service API Reference](./KNOWLEDGE-HUB-SCHEMA.md)
- [Search Utilities](../js/utils/searchHelpers.js)
- [Resource Normalizer](../js/utils/resourceNormalizer.js)
- [Reading Progress Service](../js/services/readingProgressService.js)
- [Bookmark Service](../js/services/bookmarkService.js)

