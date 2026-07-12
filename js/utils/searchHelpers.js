/**
 * ============================================================
 * Sword Institute LMS
 * Search & Filter Helpers
 * Version: 1.0.0
 * ============================================================
 *
 * Reusable utilities for searching and filtering resources.
 * Used by resourceService, UI components, and Professor SWORD.
 *
 * ============================================================
 */

/* ============================================================
   FILTER BUILDER
============================================================ */

/**
 * Build filter object for resource search
 * @param {Object} params - Filter parameters
 * @returns {Object} Filter object for resourceService
 */
function buildSearchFilters(params) {
    const filters = {};

    if (params.query) filters.query = params.query;
    if (params.academy) filters.academy = params.academy;
    if (params.type) filters.type = params.type;
    if (params.difficulty) filters.difficulty = params.difficulty;
    if (params.minRating) filters.minRating = params.minRating;
    if (params.sortBy) filters.sortBy = params.sortBy;
    if (params.pageSize) filters.pageSize = params.pageSize;

    return filters;
}

/* ============================================================
   TYPE FILTERING
============================================================ */

/**
 * Get all available resource types
 * @returns {Array} Type enum values
 */
function getResourceTypes() {
    return [
        "book",
        "paper",
        "video",
        "podcast",
        "article",
        "template",
        "toolkit",
        "case-study",
        "download",
        "policy",
        "external",
        "ai-resource",
    ];
}

/**
 * Get type display labels
 * @returns {Object} Type → Label mapping
 */
function getTypeLabels() {
    return {
        book: "📚 Books",
        paper: "📄 Research Papers",
        video: "🎥 Videos",
        podcast: "🎧 Podcasts",
        article: "📰 Articles",
        template: "📋 Templates",
        toolkit: "🛠️ Toolkits",
        "case-study": "📊 Case Studies",
        download: "⬇️ Downloads",
        policy: "📜 Policies",
        external: "🔗 External Links",
        "ai-resource": "🤖 AI Resources",
    };
}

/**
 * Filter resources by type
 * @param {Array} resources - Resources to filter
 * @param {string|Array} types - Type(s) to filter by
 * @returns {Array} Filtered resources
 */
function filterByType(resources, types) {
    if (!types) return resources;

    const typeArray = Array.isArray(types) ? types : [types];
    return resources.filter(r => typeArray.includes(r.type));
}

/* ============================================================
   DIFFICULTY FILTERING
============================================================ */

/**
 * Get difficulty levels
 * @returns {Array} Difficulty enum values
 */
function getDifficultyLevels() {
    return ["beginner", "intermediate", "advanced"];
}

/**
 * Get difficulty labels
 * @returns {Object} Level → Label mapping
 */
function getDifficultyLabels() {
    return {
        beginner: "🟢 Beginner",
        intermediate: "🟡 Intermediate",
        advanced: "🔴 Advanced",
    };
}

/**
 * Filter resources by difficulty
 * @param {Array} resources - Resources to filter
 * @param {string|Array} levels - Difficulty level(s)
 * @returns {Array} Filtered resources
 */
function filterByDifficulty(resources, levels) {
    if (!levels) return resources;

    const levelArray = Array.isArray(levels) ? levels : [levels];
    return resources.filter(r => levelArray.includes(r.difficulty));
}

/* ============================================================
   RATING FILTERING
============================================================ */

/**
 * Filter resources by minimum rating
 * @param {Array} resources - Resources to filter
 * @param {number} minRating - Minimum rating (0-5)
 * @returns {Array} Filtered resources
 */
function filterByRating(resources, minRating) {
    if (!minRating || minRating < 0) return resources;
    return resources.filter(r => (r.rating || 0) >= minRating);
}

/**
 * Get rating star display
 * @param {number} rating - Rating value (0-5)
 * @param {number} count - Rating count
 * @returns {string} Formatted rating "⭐⭐⭐⭐⭐ (42)"
 */
function formatRating(rating, count) {
    if (!rating || rating < 0) return "Not rated";

    const stars = "⭐".repeat(Math.round(rating));
    const emptyStars = "☆".repeat(5 - Math.round(rating));

    return `${stars}${emptyStars} ${count || 0}`;
}

/* ============================================================
   TIME FILTERING
============================================================ */

/**
 * Get time range options
 * @returns {Object} Duration → Label mapping (minutes)
 */
function getTimeRanges() {
    return {
        quick: { label: "💨 Quick (under 5 min)", max: 5 },
        short: { label: "⏱️ Short (5-15 min)", min: 5, max: 15 },
        medium: { label: "📖 Medium (15-45 min)", min: 15, max: 45 },
        long: { label: "📚 Long (45+ min)", min: 45 },
    };
}

/**
 * Filter resources by estimated time
 * @param {Array} resources - Resources to filter
 * @param {string|Object} range - Time range (key or custom min/max)
 * @returns {Array} Filtered resources
 */
function filterByTime(resources, range) {
    if (!range) return resources;

    let minTime = 0;
    let maxTime = Infinity;

    if (typeof range === "string") {
        const ranges = getTimeRanges();
        if (ranges[range]) {
            minTime = ranges[range].min || 0;
            maxTime = ranges[range].max || Infinity;
        }
    } else if (typeof range === "object") {
        minTime = range.min || 0;
        maxTime = range.max || Infinity;
    }

    return resources.filter(r => {
        const time = r.estimatedTime || 0;
        return time >= minTime && time <= maxTime;
    });
}

/* ============================================================
   DATE FILTERING
============================================================ */

/**
 * Get date range presets
 * @returns {Object} Preset → Date range
 */
function getDateRanges() {
    const now = new Date();

    return {
        today: {
            label: "📅 Today",
            start: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
            end: now,
        },
        week: {
            label: "📆 This Week",
            start: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
            end: now,
        },
        month: {
            label: "📊 This Month",
            start: new Date(now.getFullYear(), now.getMonth(), 1),
            end: now,
        },
        quarter: {
            label: "📈 This Quarter",
            start: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000),
            end: now,
        },
        year: {
            label: "📉 This Year",
            start: new Date(now.getFullYear(), 0, 1),
            end: now,
        },
    };
}

/**
 * Filter resources by date range
 * @param {Array} resources - Resources to filter
 * @param {string|Object} range - Date range key or {start, end}
 * @returns {Array} Filtered resources
 */
function filterByDateRange(resources, range) {
    if (!range) return resources;

    let startDate = new Date(0);
    let endDate = new Date();

    if (typeof range === "string") {
        const ranges = getDateRanges();
        if (ranges[range]) {
            startDate = ranges[range].start;
            endDate = ranges[range].end;
        }
    } else if (typeof range === "object") {
        startDate = range.start || new Date(0);
        endDate = range.end || new Date();
    }

    return resources.filter(r => {
        if (!r.createdAt) return false;
        const resDate = new Date(r.createdAt);
        return resDate >= startDate && resDate <= endDate;
    });
}

/* ============================================================
   TAG FILTERING
============================================================ */

/**
 * Get all unique tags from resources
 * @param {Array} resources - Resources to analyze
 * @returns {Array} Sorted unique tags
 */
function getAllTags(resources) {
    const tagSet = new Set();
    resources.forEach(r => {
        (r.tags || []).forEach(tag => tagSet.add(tag));
    });
    return Array.from(tagSet).sort();
}

/**
 * Filter resources by tags
 * @param {Array} resources - Resources to filter
 * @param {string|Array} tags - Tag(s) to include
 * @param {boolean} matchAll - Require all tags? (default: any tag)
 * @returns {Array} Filtered resources
 */
function filterByTags(resources, tags, matchAll = false) {
    if (!tags) return resources;

    const tagArray = Array.isArray(tags) ? tags : [tags];

    return resources.filter(r => {
        const resTags = r.tags || [];

        if (matchAll) {
            // Resource must have ALL specified tags
            return tagArray.every(tag => resTags.includes(tag));
        } else {
            // Resource must have ANY specified tag
            return tagArray.some(tag => resTags.includes(tag));
        }
    });
}

/* ============================================================
   FULL-TEXT SEARCH
============================================================ */

/**
 * Perform full-text search on resources
 * @param {Array} resources - Resources to search
 * @param {string} query - Search query
 * @param {Array} fields - Fields to search (default: all)
 * @returns {Array} Matching resources, sorted by relevance
 */
function fullTextSearch(resources, query, fields = null) {
    if (!query || query.length < 2) return resources;

    const q = query.toLowerCase();
    const searchFields = fields || [
        "title",
        "shortDescription",
        "description",
        "author",
        "tags",
    ];

    const results = resources.map(r => {
        let relevance = 0;

        // Check each field
        searchFields.forEach(field => {
            const value = r[field];
            if (!value) return;

            if (Array.isArray(value)) {
                // For tags array
                value.forEach(v => {
                    if (v.toLowerCase().includes(q)) {
                        relevance += 100; // Exact tag match
                    }
                });
            } else {
                const strValue = String(value).toLowerCase();
                if (strValue === q) {
                    relevance += 100; // Exact match
                } else if (strValue.startsWith(q)) {
                    relevance += 50; // Starts with
                } else if (strValue.includes(q)) {
                    relevance += 25; // Contains
                }
            }
        });

        return { resource: r, relevance };
    });

    // Filter out non-matches and sort by relevance
    return results
        .filter(r => r.relevance > 0)
        .sort((a, b) => b.relevance - a.relevance)
        .map(r => r.resource);
}

/* ============================================================
   SORTING
============================================================ */

/**
 * Get sort options
 * @returns {Object} Sort key → Label mapping
 */
function getSortOptions() {
    return {
        newest: "🆕 Newest First",
        oldest: "📅 Oldest First",
        rating: "⭐ Highest Rated",
        views: "👁️ Most Viewed",
        title_asc: "A-Z Title",
        title_desc: "Z-A Title",
    };
}

/**
 * Sort resources
 * @param {Array} resources - Resources to sort
 * @param {string} sortBy - Sort key
 * @returns {Array} Sorted resources
 */
function sortResources(resources, sortBy = "newest") {
    const sorted = [...resources];

    switch (sortBy) {
        case "newest":
            sorted.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
            break;

        case "oldest":
            sorted.sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
            break;

        case "rating":
            sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0));
            break;

        case "views":
            sorted.sort((a, b) => (b.views || 0) - (a.views || 0));
            break;

        case "title_asc":
            sorted.sort((a, b) => a.title.localeCompare(b.title));
            break;

        case "title_desc":
            sorted.sort((a, b) => b.title.localeCompare(a.title));
            break;

        default:
            // No sort
    }

    return sorted;
}

/* ============================================================
   EXPORTS
============================================================ */

export {
    buildSearchFilters,
    getResourceTypes,
    getTypeLabels,
    filterByType,
    getDifficultyLevels,
    getDifficultyLabels,
    filterByDifficulty,
    filterByRating,
    formatRating,
    getTimeRanges,
    filterByTime,
    getDateRanges,
    filterByDateRange,
    getAllTags,
    filterByTags,
    fullTextSearch,
    getSortOptions,
    sortResources,
};

export default {
    buildSearchFilters,
    getResourceTypes,
    getTypeLabels,
    filterByType,
    getDifficultyLevels,
    getDifficultyLabels,
    filterByDifficulty,
    filterByRating,
    formatRating,
    getTimeRanges,
    filterByTime,
    getDateRanges,
    filterByDateRange,
    getAllTags,
    filterByTags,
    fullTextSearch,
    getSortOptions,
    sortResources,
};
