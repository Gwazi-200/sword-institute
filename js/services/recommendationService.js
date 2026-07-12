/**
 * ============================================================
 * Sword Institute LMS
 * Recommendation Service
 * Version: 1.0.0
 * ============================================================
 *
 * Intelligent recommendation engine for personalized resource
 * suggestions based on student reading history and learning patterns.
 *
 * Features:
 * - Personalized recommendations from reading history
 * - Trending resources across all students
 * - Similar resource discovery
 * - Skill-based suggestions
 * - Difficulty-appropriate recommendations
 *
 * ============================================================
 */

import { getReadingHistory, getReadingStats } from "./readingProgressService.js";
import {
    getPopularResources,
    getTrendingResources,
    loadResources,
} from "./resourceService.js";
import { computeRelevanceScore } from "../utils/resourceNormalizer.js";

// Cache configuration
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
let cache = {
    personalizedRecs: {},
    trendingRecs: null,
    similarResources: {},
    skillBasedRecs: {},
};
let cacheTimestamps = {
    personalizedRecs: {},
    trendingRecs: null,
    similarResources: {},
    skillBasedRecs: {},
};

/**
 * Get personalized recommendations for a student
 *
 * @param {string} studentId - Student identifier
 * @param {number} limit - Number of recommendations (default: 10)
 * @returns {Promise<Array>} Array of recommended resources
 *
 * @example
 * const recommendations = await getRecommendations("student_123");
 * console.log(recommendations[0]); // { resourceId, title, reason, score }
 */
export async function getRecommendations(studentId, limit = 10) {
    try {
        // Check cache
        const cached = getFromCache("personalizedRecs", studentId);
        if (cached) return cached.slice(0, limit);

        // Get student's reading history and stats
        const [readingHistory, stats] = await Promise.all([
            getReadingHistory(studentId, 50),
            getReadingStats(studentId),
        ]);

        if (readingHistory.length === 0) {
            // New student: return trending resources
            return getTrendingResourcesRecommendations(limit);
        }

        // Get all resources
        const allResources = await loadResources();

        // Calculate recommendation scores
        const recommendations = calculateRecommendations(
            studentId,
            readingHistory,
            allResources,
            stats
        );

        // Sort by score (highest first)
        recommendations.sort((a, b) => b.score - a.score);

        // Cache results
        setInCache("personalizedRecs", studentId, recommendations);

        return recommendations.slice(0, limit);
    } catch (error) {
        console.error("[RecommendationService] Error getting recommendations:", error);
        throw error;
    }
}

/**
 * Get trending resources (popular across all students)
 *
 * @param {number} limit - Number of resources (default: 10)
 * @returns {Promise<Array>} Array of trending resources
 */
export async function getTrendingResourcesRecommendations(limit = 10) {
    try {
        // Check cache
        if (cache.trendingRecs && isValidCache(cacheTimestamps.trendingRecs)) {
            return cache.trendingRecs.slice(0, limit);
        }

        const trending = await getTrendingResources(limit * 2);

        // Add recommendation metadata
        const recommendations = trending.map(resource => ({
            ...resource,
            reason: "Trending resource",
            score: resource.views || 0,
        }));

        // Cache
        cache.trendingRecs = recommendations;
        cacheTimestamps.trendingRecs = Date.now();

        return recommendations.slice(0, limit);
    } catch (error) {
        console.error("[RecommendationService] Error getting trending:", error);
        throw error;
    }
}

/**
 * Get resources similar to a given resource
 *
 * @param {string} resourceId - Reference resource ID
 * @param {number} limit - Number of similar resources (default: 5)
 * @returns {Promise<Array>} Array of similar resources
 */
export async function getSimilarResources(resourceId, limit = 5) {
    try {
        // Check cache
        const cached = getFromCache("similarResources", resourceId);
        if (cached) return cached.slice(0, limit);

        const allResources = await loadResources();
        const referenceResource = allResources.find(r => r.resourceId === resourceId);

        if (!referenceResource) {
            console.warn(`[RecommendationService] Resource ${resourceId} not found`);
            return [];
        }

        // Find similar resources
        const similar = allResources
            .filter(r => r.resourceId !== resourceId)
            .map(resource => {
                // Calculate similarity score based on:
                // - Same type (high weight)
                // - Same difficulty (medium weight)
                // - Same academy (medium weight)
                // - Related tags (if present)

                let score = 0;

                if (resource.type === referenceResource.type) score += 40;
                if (resource.difficulty === referenceResource.difficulty) score += 25;
                if (resource.academy === referenceResource.academy) score += 25;

                // Tag similarity (if available)
                if (referenceResource.tags && resource.tags) {
                    const commonTags = referenceResource.tags.filter(t =>
                        resource.tags.includes(t)
                    );
                    score += commonTags.length * 5;
                }

                return { ...resource, score };
            })
            .filter(r => r.score > 0)
            .sort((a, b) => b.score - a.score);

        // Cache
        setInCache("similarResources", resourceId, similar);

        return similar.slice(0, limit);
    } catch (error) {
        console.error("[RecommendationService] Error getting similar resources:", error);
        throw error;
    }
}

/**
 * Get skill-based recommendations
 * (Resources that help develop specific skills)
 *
 * @param {string} studentId - Student ID
 * @param {string} skillName - Target skill (e.g., "Python", "Data Analysis")
 * @param {number} limit - Number of resources (default: 8)
 * @returns {Promise<Array>} Array of skill-building resources
 */
export async function getSkillBasedRecommendations(studentId, skillName, limit = 8) {
    try {
        // Check cache
        const cacheKey = `${studentId}:${skillName}`;
        const cached = getFromCache("skillBasedRecs", cacheKey);
        if (cached) return cached.slice(0, limit);

        const allResources = await loadResources();

        // Filter resources that mention the skill
        const skillResources = allResources
            .filter(resource => {
                const text = `${resource.title} ${resource.description} ${(resource.tags || []).join(" ")}`.toLowerCase();
                const skillLower = skillName.toLowerCase();
                return text.includes(skillLower);
            })
            .map(resource => ({
                ...resource,
                reason: `Learn ${skillName}`,
                score: resource.rating || 0,
            }))
            .sort((a, b) => b.score - a.score);

        // Cache
        setInCache("skillBasedRecs", cacheKey, skillResources);

        return skillResources.slice(0, limit);
    } catch (error) {
        console.error("[RecommendationService] Error getting skill-based recommendations:", error);
        throw error;
    }
}

/**
 * Get academy-specific recommendations
 *
 * @param {string} studentId - Student ID
 * @param {string} academy - Academy name
 * @param {number} limit - Number of resources (default: 6)
 * @returns {Promise<Array>} Array of academy resources
 */
export async function getAcademyRecommendations(studentId, academy, limit = 6) {
    try {
        const allResources = await loadResources();

        const recommendations = allResources
            .filter(r => r.academy === academy)
            .map(resource => ({
                ...resource,
                reason: `Featured in ${academy}`,
                score: resource.rating || 0,
            }))
            .sort((a, b) => b.score - a.score);

        return recommendations.slice(0, limit);
    } catch (error) {
        console.error("[RecommendationService] Error getting academy recommendations:", error);
        throw error;
    }
}

/**
 * Get difficulty-appropriate recommendations
 * (Resources matching student's current level with slight challenge)
 *
 * @param {string} studentId - Student ID
 * @param {number} limit - Number of resources (default: 8)
 * @returns {Promise<Array>} Array of appropriately-leveled resources
 */
export async function getDifficultyBasedRecommendations(studentId, limit = 8) {
    try {
        const stats = await getReadingStats(studentId);

        // Estimate student's skill level from reading history
        const skillLevel = estimateSkillLevel(stats);

        const allResources = await loadResources();

        // Get resources at current level and next level
        const recommendations = allResources
            .filter(r =>
                r.difficulty === skillLevel ||
                (skillLevel === "beginner" && r.difficulty === "intermediate") ||
                (skillLevel === "intermediate" && r.difficulty === "advanced") ||
                (skillLevel === "advanced" && r.difficulty === "expert")
            )
            .map(resource => ({
                ...resource,
                reason:
                    resource.difficulty === skillLevel
                        ? "Your level"
                        : "Next level challenge",
                score: resource.rating || 0,
            }))
            .sort((a, b) => b.score - a.score);

        return recommendations.slice(0, limit);
    } catch (error) {
        console.error("[RecommendationService] Error getting difficulty recommendations:", error);
        throw error;
    }
}

/**
 * Calculate recommendation scores for resources
 * @private
 */
function calculateRecommendations(studentId, readingHistory, allResources, stats) {
    const recommendations = [];
    const readResourceIds = new Set(readingHistory.map(r => r.resourceId));

    allResources.forEach(resource => {
        // Don't recommend already-read resources
        if (readResourceIds.has(resource.resourceId)) return;

        let score = 0;
        let reason = [];

        // Factor 1: Matching type with most-read type (weight: 30)
        const typeFrequency = calculateFrequency(readingHistory, "type");
        if (typeFrequency[resource.type]) {
            score += typeFrequency[resource.type] * 30;
            reason.push(`Similar to your ${resource.type}s`);
        }

        // Factor 2: Resource rating (weight: 25)
        if (resource.rating) {
            score += resource.rating * 5; // Normalize to 0-25
        }

        // Factor 3: Popularity (views) (weight: 20)
        if (resource.views) {
            score += Math.min(resource.views / 100, 20); // Cap at 20
            reason.push("Popular resource");
        }

        // Factor 4: Difficulty progression (weight: 15)
        const avgDifficulty = estimateSkillLevel(stats);
        if (getDifficultyScore(resource.difficulty) === getDifficultyScore(avgDifficulty)) {
            score += 10;
        } else if (getDifficultyScore(resource.difficulty) === getDifficultyScore(avgDifficulty) + 1) {
            score += 15; // Slightly harder = good
            reason.push("Next-level challenge");
        }

        // Factor 5: Academy diversity (weight: 10)
        const academyFrequency = calculateFrequency(readingHistory, "academy");
        if (!academyFrequency[resource.academy]) {
            score += 10;
            reason.push("New academy");
        }

        recommendations.push({
            ...resource,
            reason: reason.join(" • ") || "Recommended for you",
            score,
            relevance: Math.min(score / 100, 1), // 0-1 scale
        });
    });

    return recommendations.filter(r => r.score > 0);
}

/**
 * Estimate student skill level from reading stats
 * @private
 */
function estimateSkillLevel(stats) {
    if (!stats || !stats.totalCompleted) return "beginner";

    const avgProgress = stats.totalCompleted > 0 ? 100 : 0;

    if (stats.totalStarted < 5) return "beginner";
    if (stats.totalCompleted < 3) return "intermediate";
    if (stats.totalCompleted < 10) return "advanced";
    return "expert";
}

/**
 * Get difficulty score for comparison
 * @private
 */
function getDifficultyScore(difficulty) {
    const scores = {
        beginner: 1,
        intermediate: 2,
        advanced: 3,
        expert: 4,
    };
    return scores[difficulty] || 0;
}

/**
 * Calculate frequency of items in array
 * @private
 */
function calculateFrequency(items, key) {
    const freq = {};
    items.forEach(item => {
        const value = item[key];
        freq[value] = (freq[value] || 0) + 1;
    });
    return freq;
}

/**
 * Get from cache with TTL validation
 * @private
 */
function getFromCache(cacheType, key) {
    const cache_ = cache[cacheType];
    const timestamp = cacheTimestamps[cacheType];

    if (!cache_ || !cache_[key]) return null;
    if (!isValidCache(timestamp[key])) {
        delete cache_[key];
        return null;
    }

    return cache_[key];
}

/**
 * Set value in cache
 * @private
 */
function setInCache(cacheType, key, value) {
    if (!cache[cacheType]) cache[cacheType] = {};
    if (!cacheTimestamps[cacheType]) cacheTimestamps[cacheType] = {};

    cache[cacheType][key] = value;
    cacheTimestamps[cacheType][key] = Date.now();
}

/**
 * Check if cache entry is still valid
 * @private
 */
function isValidCache(timestamp) {
    if (!timestamp) return false;
    return Date.now() - timestamp < CACHE_TTL;
}

/**
 * Clear all recommendations cache
 */
export function clearRecommendationCache() {
    cache = {
        personalizedRecs: {},
        trendingRecs: null,
        similarResources: {},
        skillBasedRecs: {},
    };
    cacheTimestamps = {
        personalizedRecs: {},
        trendingRecs: null,
        similarResources: {},
        skillBasedRecs: {},
    };
    console.log("[RecommendationService] Cache cleared");
}

/**
 * Get cache statistics
 */
export function getRecommendationCacheStatus() {
    return {
        personalizedRecsCount: Object.keys(cache.personalizedRecs).length,
        trendingRecsCached: cache.trendingRecs !== null,
        similarResourcesCount: Object.keys(cache.similarResources).length,
        skillBasedRecsCount: Object.keys(cache.skillBasedRecs).length,
        cacheSize: JSON.stringify(cache).length,
    };
}

export default {
    getRecommendations,
    getTrendingResourcesRecommendations,
    getSimilarResources,
    getSkillBasedRecommendations,
    getAcademyRecommendations,
    getDifficultyBasedRecommendations,
    clearRecommendationCache,
    getRecommendationCacheStatus,
};
