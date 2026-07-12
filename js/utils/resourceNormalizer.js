/**
 * ============================================================
 * Sword Institute LMS
 * Resource Normalizer Utility
 * Version: 1.0.0
 * ============================================================
 *
 * This utility normalizes knowledge resources from Firestore
 * into a consistent shape for the application.
 *
 * Similar to courseNormalizer.js but for resources.
 *
 * ============================================================
 */

/**
 * Normalize a single resource document from Firestore
 * @param {Object} doc - Firestore document data
 * @returns {Object} Normalized resource
 */
function normalizeResource(doc) {
    if (!doc) return null;

    const resource = {
        // Core IDs
        resourceId: doc.resourceId || doc.id || "",
        slug: doc.slug || "",

        // Content
        title: doc.title || "Untitled Resource",
        description: doc.description || "",
        shortDescription: doc.shortDescription || "",

        // Classification
        type: doc.type || "article",
        format: doc.format || "pdf",

        // Media
        thumbnailURL: doc.thumbnailURL || "",
        contentURL: doc.contentURL || "",

        // Author & Dates
        author: doc.author || "Unknown",
        authorBio: doc.authorBio || "",
        publishedDate: doc.publishedDate || null,
        updatedDate: doc.updatedDate || null,
        createdAt: doc.createdAt || null,

        // Classification
        academy: doc.academy || "",
        relatedCourses: doc.relatedCourses || [],
        tags: doc.tags || [],

        // Difficulty & Time
        difficulty: doc.difficulty || "beginner",
        estimatedTime: doc.estimatedTime || 0,

        // Engagement
        rating: doc.rating || 0,
        ratingCount: doc.ratingCount || 0,
        views: doc.views || 0,
        downloads: doc.downloads || 0,
        saves: doc.saves || 0,
        shares: doc.shares || 0,

        // Status
        isPublished: doc.isPublished !== undefined ? doc.isPublished : true,
        isSponsored: doc.isSponsored || false,
        isFeatured: doc.isFeatured || false,

        // Metadata
        language: doc.language || "en",
        metadata: doc.metadata || {},
    };

    return resource;
}

/**
 * Normalize an array of resources
 * @param {Array} docs - Array of Firestore documents
 * @returns {Array} Normalized resources
 */
function normalizeResources(docs) {
    if (!Array.isArray(docs)) return [];
    return docs.map(normalizeResource).filter(Boolean);
}

/**
 * Add cache metadata to a resource
 * @param {Object} resource - Normalized resource
 * @param {boolean} isCached - Is this from cache?
 * @returns {Object} Resource with metadata
 */
function addCached(resource, isCached = true) {
    return {
        ...resource,
        _isCached: isCached,
        _cachedAt: isCached ? new Date() : null,
    };
}

/**
 * Format duration as human-readable string
 * @param {number} minutes - Duration in minutes
 * @returns {string} Formatted duration e.g. "45 mins" or "2 hours"
 */
function formatResourceTime(minutes) {
    if (!minutes || minutes <= 0) return "Quick read";

    if (minutes < 60) {
        return `${Math.round(minutes)} min${minutes > 1 ? "s" : ""}`;
    }

    const hours = Math.round(minutes / 60);
    if (hours === 1) return "1 hour";

    const mins = minutes % 60;
    if (mins === 0) return `${hours} hours`;

    return `${hours}h ${mins}m`;
}

/**
 * Get best thumbnail URL for a resource
 * @param {Object} resource - Normalized resource
 * @returns {string} Thumbnail URL or default
 */
function getThumbnailURL(resource) {
    if (!resource) return "/images/default-resource.jpg";

    // Prefer custom thumbnail
    if (resource.thumbnailURL) {
        return resource.thumbnailURL;
    }

    // Generate based on type
    const typeIcons = {
        book: "/images/thumbnails/book.jpg",
        paper: "/images/thumbnails/paper.jpg",
        video: "/images/thumbnails/video.jpg",
        podcast: "/images/thumbnails/podcast.jpg",
        article: "/images/thumbnails/article.jpg",
        template: "/images/thumbnails/template.jpg",
        toolkit: "/images/thumbnails/toolkit.jpg",
        "case-study": "/images/thumbnails/case-study.jpg",
        download: "/images/thumbnails/download.jpg",
        policy: "/images/thumbnails/policy.jpg",
        external: "/images/thumbnails/external.jpg",
        "ai-resource": "/images/thumbnails/ai.jpg",
    };

    return typeIcons[resource.type] || "/images/default-resource.jpg";
}

/**
 * Get best content URL (handles Cloud Storage vs external)
 * @param {Object} resource - Normalized resource
 * @returns {string} Content URL to open/download
 */
function getContentURL(resource) {
    if (!resource) return null;

    // For Cloud Storage paths, convert to public URLs
    if (resource.contentURL && resource.contentURL.includes("gs://")) {
        // gs://bucket/path → public URL via Cloud Storage
        // This requires Firebase Storage download URL generation
        // For now, return as-is (backend can handle)
        return resource.contentURL;
    }

    // External URLs (e.g., YouTube, Medium)
    if (resource.contentURL) {
        return resource.contentURL;
    }

    return null;
}

/**
 * Get type display name
 * @param {string} type - Resource type enum
 * @returns {string} Human-readable type name
 */
function getTypeDisplayName(type) {
    const typeNames = {
        book: "📚 Book",
        paper: "📄 Research Paper",
        video: "🎥 Video",
        podcast: "🎧 Podcast",
        article: "📰 Article",
        template: "📋 Template",
        toolkit: "🛠️ Toolkit",
        "case-study": "📊 Case Study",
        download: "⬇️ Download",
        policy: "📜 Policy",
        external: "🔗 External Resource",
        "ai-resource": "🤖 AI Resource",
    };

    return typeNames[type] || type;
}

/**
 * Get difficulty badge color
 * @param {string} difficulty - Difficulty level
 * @returns {Object} { color, bgColor, textColor }
 */
function getDifficultyBadgeColor(difficulty) {
    const colors = {
        beginner: {
            color: "#10B981",
            bgColor: "rgba(16, 185, 129, 0.1)",
            textColor: "#059669",
        },
        intermediate: {
            color: "#F59E0B",
            bgColor: "rgba(245, 158, 11, 0.1)",
            textColor: "#D97706",
        },
        advanced: {
            color: "#EF4444",
            bgColor: "rgba(239, 68, 68, 0.1)",
            textColor: "#DC2626",
        },
    };

    return colors[difficulty] || colors.beginner;
}

/**
 * Check if resource matches search query
 * @param {Object} resource - Normalized resource
 * @param {string} query - Search query
 * @returns {boolean} Does resource match?
 */
function matchesQuery(resource, query) {
    if (!query || query.length < 2) return true;

    const q = query.toLowerCase();

    return (
        resource.title.toLowerCase().includes(q) ||
        resource.shortDescription.toLowerCase().includes(q) ||
        resource.description.toLowerCase().includes(q) ||
        resource.author.toLowerCase().includes(q) ||
        (resource.tags || []).some(tag => tag.toLowerCase().includes(q))
    );
}

/**
 * Sort resources by field
 * @param {Array} resources - Resources to sort
 * @param {string} sortBy - Sort field: "rating", "views", "date", "title"
 * @param {string} order - "asc" or "desc" (default)
 * @returns {Array} Sorted resources
 */
function sortResources(resources, sortBy = "date", order = "desc") {
    const sorted = [...resources];

    switch (sortBy) {
        case "rating":
            sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0));
            break;

        case "views":
            sorted.sort((a, b) => (b.views || 0) - (a.views || 0));
            break;

        case "date":
            sorted.sort((a, b) => {
                const aDate = a.createdAt ? new Date(a.createdAt) : new Date(0);
                const bDate = b.createdAt ? new Date(b.createdAt) : new Date(0);
                return bDate - aDate;
            });
            break;

        case "title":
            sorted.sort((a, b) => a.title.localeCompare(b.title));
            break;

        default:
            // No sort
    }

    if (order === "asc") {
        sorted.reverse();
    }

    return sorted;
}

/**
 * Compute relevance score for resource (for recommendations)
 * @param {Object} resource - Resource to score
 * @param {string} query - User's implicit or explicit query
 * @returns {number} Relevance score 0-100
 */
function computeRelevanceScore(resource, query = "") {
    let score = 50; // Base score

    // Boost by rating
    score += (resource.rating || 0) * 5; // 0-25 points

    // Boost by engagement
    score += Math.min((resource.views || 0) / 100, 15); // 0-15 points

    // Boost if featured
    if (resource.isFeatured) score += 10;

    // Boost for recency (within last 30 days)
    if (resource.createdAt) {
        const ageMs = Date.now() - new Date(resource.createdAt).getTime();
        const ageDays = ageMs / (1000 * 60 * 60 * 24);
        if (ageDays < 30) score += Math.max(0, 10 - ageDays / 3);
    }

    // Boost if matches query
    if (query && matchesQuery(resource, query)) {
        score += 20;
    }

    return Math.min(100, Math.max(0, score));
}

/* ============================================================
   EXPORTS
============================================================ */

export {
    normalizeResource,
    normalizeResources,
    addCached,
    formatResourceTime,
    getThumbnailURL,
    getContentURL,
    getTypeDisplayName,
    getDifficultyBadgeColor,
    matchesQuery,
    sortResources,
    computeRelevanceScore,
};

export default {
    normalizeResource,
    normalizeResources,
    addCached,
    formatResourceTime,
    getThumbnailURL,
    getContentURL,
    getTypeDisplayName,
    getDifficultyBadgeColor,
    matchesQuery,
    sortResources,
    computeRelevanceScore,
};
