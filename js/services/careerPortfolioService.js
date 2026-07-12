/**
 * ============================================================
 * Sword Institute LMS
 * Career Portfolio Service
 * Version: 1.0.0
 * ============================================================
 *
 * Manages student career development tracking including
 * completed resources, certificates, skills, and achievements.
 *
 * Features:
 * - Career portfolio aggregation
 * - Certificate tracking
 * - Skill acquisition logging
 * - Achievement badges
 * - Milestone tracking
 *
 * ============================================================
 */

import {
    doc,
    collection,
    getDoc,
    setDoc,
    updateDoc,
    arrayUnion,
    serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebase.js";
import { getReadingStats, getReadingHistory } from "./readingProgressService.js";

// Cache configuration
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes
let cache = {};

/**
 * Get complete career portfolio for a student
 *
 * @param {string} studentId - Student identifier
 * @returns {Promise<Object>} Complete portfolio with all achievements
 *
 * @example
 * const portfolio = await getCareerPortfolio("student_123");
 * console.log(portfolio);
 * // {
 * //   studentId, name, profileImage,
 * //   completedResources: [...],
 * //   certificates: [...],
 * //   skills: [...],
 * //   achievements: [...],
 * //   stats: { totalCompleted, totalCertificates, totalSkills, ... },
 * //   joinedDate, lastUpdated
 * // }
 */
export async function getCareerPortfolio(studentId) {
    try {
        // Check cache
        if (cache[studentId] && isValidCache(cache[studentId].timestamp)) {
            return cache[studentId].data;
        }

        // Get student document
        const studentDoc = await getDoc(doc(db, "students", studentId));

        if (!studentDoc.exists()) {
            console.warn(`[CareerPortfolioService] Student ${studentId} not found`);
            return null;
        }

        const studentData = studentDoc.data();

        // Get portfolio collection
        const portfolioSnapshot = await getDoc(doc(db, "career_portfolios", studentId));

        let portfolioData = {};
        if (portfolioSnapshot.exists()) {
            portfolioData = portfolioSnapshot.data();
        }

        // Compile complete portfolio
        const portfolio = {
            studentId,
            name: studentData.fullName || studentData.name || "Student",
            profileImage: studentData.profileImage || null,
            email: studentData.email || null,
            completedResources: portfolioData.completedResources || [],
            certificates: portfolioData.certificates || [],
            skills: portfolioData.skills || [],
            achievements: portfolioData.achievements || [],
            stats: {
                totalCompleted: (portfolioData.completedResources || []).length,
                totalCertificates: (portfolioData.certificates || []).length,
                totalSkills: (portfolioData.skills || []).length,
                totalAchievements: (portfolioData.achievements || []).length,
                totalLearningHours: calculateTotalHours(portfolioData.completedResources || []),
                completionRate: await calculateCompletionRate(studentId),
            },
            joinedDate: studentData.createdAt || null,
            lastUpdated: portfolioData.lastUpdated || null,
        };

        // Cache result
        cache[studentId] = {
            data: portfolio,
            timestamp: Date.now(),
        };

        return portfolio;
    } catch (error) {
        console.error("[CareerPortfolioService] Error getting portfolio:", error);
        throw error;
    }
}

/**
 * Get completed resources for a student
 *
 * @param {string} studentId - Student ID
 * @param {Object} options - Query options (academy, type, sortBy)
 * @returns {Promise<Array>} Completed resources with metadata
 */
export async function getCompletedResources(studentId, options = {}) {
    try {
        const portfolio = await getCareerPortfolio(studentId);

        if (!portfolio) return [];

        let completed = portfolio.completedResources;

        // Filter by academy
        if (options.academy) {
            completed = completed.filter(r => r.academy === options.academy);
        }

        // Filter by type
        if (options.type) {
            completed = completed.filter(r => r.type === options.type);
        }

        // Sort
        if (options.sortBy === "recent") {
            completed.sort((a, b) => new Date(b.completedDate) - new Date(a.completedDate));
        } else if (options.sortBy === "rating") {
            completed.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        }

        return completed;
    } catch (error) {
        console.error("[CareerPortfolioService] Error getting completed resources:", error);
        throw error;
    }
}

/**
 * Get earned certificates
 *
 * @param {string} studentId - Student ID
 * @returns {Promise<Array>} Array of certificate objects
 */
export async function getEarnedCertificates(studentId) {
    try {
        const portfolio = await getCareerPortfolio(studentId);
        return portfolio?.certificates || [];
    } catch (error) {
        console.error("[CareerPortfolioService] Error getting certificates:", error);
        throw error;
    }
}

/**
 * Get acquired skills
 *
 * @param {string} studentId - Student ID
 * @returns {Promise<Array>} Array of skill objects with proficiency levels
 *
 * @example
 * const skills = await getAcquiredSkills("student_123");
 * // [
 * //   { skillName: "Python", proficiency: "intermediate", resources: 5 },
 * //   { skillName: "Machine Learning", proficiency: "beginner", resources: 3 }
 * // ]
 */
export async function getAcquiredSkills(studentId) {
    try {
        const portfolio = await getCareerPortfolio(studentId);
        const skills = portfolio?.skills || [];

        // Calculate proficiency level based on resources completed
        return skills.map(skill => {
            const resourceCount = skill.resources || 0;
            const proficiency =
                resourceCount < 3 ? "beginner" : resourceCount < 7 ? "intermediate" : "advanced";

            return {
                ...skill,
                proficiency,
            };
        });
    } catch (error) {
        console.error("[CareerPortfolioService] Error getting skills:", error);
        throw error;
    }
}

/**
 * Get achievements/badges
 *
 * @param {string} studentId - Student ID
 * @returns {Promise<Array>} Array of achievement objects
 *
 * @example
 * const achievements = await getAchievements("student_123");
 * // [
 * //   { id: "first_resource", name: "Curious Mind", icon: "🎓" },
 * //   { id: "100_hours", name: "Dedicated Learner", icon: "🔥" }
 * // ]
 */
export async function getAchievements(studentId) {
    try {
        const portfolio = await getCareerPortfolio(studentId);
        return portfolio?.achievements || [];
    } catch (error) {
        console.error("[CareerPortfolioService] Error getting achievements:", error);
        throw error;
    }
}

/**
 * Add completed resource to portfolio
 *
 * @param {string} studentId - Student ID
 * @param {Object} resource - Resource data to add
 * @returns {Promise<void>}
 *
 * @example
 * await addCompletedResource("student_123", {
 *   resourceId: "res_001",
 *   title: "Python Basics",
 *   type: "book",
 *   academy: "AI Masters",
 *   completedDate: new Date(),
 *   timeSpent: 3600
 * });
 */
export async function addCompletedResource(studentId, resource) {
    try {
        const portfolioRef = doc(db, "career_portfolios", studentId);

        await updateDoc(portfolioRef, {
            completedResources: arrayUnion({
                ...resource,
                completedDate: resource.completedDate || serverTimestamp(),
            }),
            lastUpdated: serverTimestamp(),
        });

        // Invalidate cache
        delete cache[studentId];

        // Check for achievements
        await checkAndAwardAchievements(studentId);

        console.log(`[CareerPortfolioService] Added completed resource for ${studentId}`);
    } catch (error) {
        // If document doesn't exist, create it
        if (error.code === "not-found") {
            await initializePortfolio(studentId);
            return addCompletedResource(studentId, resource);
        }
        console.error("[CareerPortfolioService] Error adding completed resource:", error);
        throw error;
    }
}

/**
 * Award a certificate to student
 *
 * @param {string} studentId - Student ID
 * @param {Object} certificate - Certificate data
 * @returns {Promise<void>}
 *
 * @example
 * await awardCertificate("student_123", {
 *   certificateId: "cert_001",
 *   title: "AI Fundamentals Certificate",
 *   issuedDate: new Date(),
 *   expiryDate: new Date(Date.now() + 365*24*60*60*1000),
 *   url: "https://..."
 * });
 */
export async function awardCertificate(studentId, certificate) {
    try {
        const portfolioRef = doc(db, "career_portfolios", studentId);

        await updateDoc(portfolioRef, {
            certificates: arrayUnion({
                ...certificate,
                issuedDate: certificate.issuedDate || serverTimestamp(),
            }),
            lastUpdated: serverTimestamp(),
        });

        // Invalidate cache
        delete cache[studentId];

        console.log(`[CareerPortfolioService] Awarded certificate to ${studentId}`);
    } catch (error) {
        if (error.code === "not-found") {
            await initializePortfolio(studentId);
            return awardCertificate(studentId, certificate);
        }
        console.error("[CareerPortfolioService] Error awarding certificate:", error);
        throw error;
    }
}

/**
 * Add skill to portfolio
 *
 * @param {string} studentId - Student ID
 * @param {Object} skill - Skill data { skillName, category, resources }
 * @returns {Promise<void>}
 */
export async function addSkill(studentId, skill) {
    try {
        const portfolioRef = doc(db, "career_portfolios", studentId);

        await updateDoc(portfolioRef, {
            skills: arrayUnion({
                ...skill,
                acquiredDate: skill.acquiredDate || serverTimestamp(),
            }),
            lastUpdated: serverTimestamp(),
        });

        delete cache[studentId];

        console.log(`[CareerPortfolioService] Added skill "${skill.skillName}" to ${studentId}`);
    } catch (error) {
        if (error.code === "not-found") {
            await initializePortfolio(studentId);
            return addSkill(studentId, skill);
        }
        console.error("[CareerPortfolioService] Error adding skill:", error);
        throw error;
    }
}

/**
 * Award achievement/badge
 *
 * @param {string} studentId - Student ID
 * @param {Object} achievement - Achievement data { id, name, icon, description }
 * @returns {Promise<void>}
 */
export async function awardAchievement(studentId, achievement) {
    try {
        const portfolio = await getCareerPortfolio(studentId);

        // Check if already awarded
        const exists = portfolio.achievements.some(a => a.id === achievement.id);
        if (exists) return;

        const portfolioRef = doc(db, "career_portfolios", studentId);

        await updateDoc(portfolioRef, {
            achievements: arrayUnion({
                ...achievement,
                awardedDate: achievement.awardedDate || serverTimestamp(),
            }),
            lastUpdated: serverTimestamp(),
        });

        delete cache[studentId];

        console.log(`[CareerPortfolioService] Awarded achievement "${achievement.name}" to ${studentId}`);
    } catch (error) {
        console.error("[CareerPortfolioService] Error awarding achievement:", error);
    }
}

/**
 * Initialize portfolio for new student
 * @private
 */
async function initializePortfolio(studentId) {
    try {
        const portfolioRef = doc(db, "career_portfolios", studentId);

        await setDoc(portfolioRef, {
            studentId,
            completedResources: [],
            certificates: [],
            skills: [],
            achievements: [],
            createdDate: serverTimestamp(),
            lastUpdated: serverTimestamp(),
        });

        console.log(`[CareerPortfolioService] Initialized portfolio for ${studentId}`);
    } catch (error) {
        console.error("[CareerPortfolioService] Error initializing portfolio:", error);
    }
}

/**
 * Calculate total learning hours
 * @private
 */
function calculateTotalHours(completedResources) {
    return completedResources.reduce((total, resource) => {
        const timeSpent = resource.timeSpent || 0;
        return total + timeSpent / 3600; // Convert seconds to hours
    }, 0);
}

/**
 * Calculate completion rate
 * @private
 */
async function calculateCompletionRate(studentId) {
    try {
        const stats = await getReadingStats(studentId);
        if (!stats || stats.totalStarted === 0) return 0;

        return Math.round((stats.totalCompleted / stats.totalStarted) * 100);
    } catch (error) {
        console.log("[CareerPortfolioService] Error calculating completion rate:", error);
        return 0;
    }
}

/**
 * Check and award achievements based on portfolio progress
 * @private
 */
async function checkAndAwardAchievements(studentId) {
    try {
        const portfolio = await getCareerPortfolio(studentId);
        const stats = portfolio.stats;

        // Achievement definitions
        const achievementChecks = [
            {
                id: "first_resource",
                condition: () => stats.totalCompleted >= 1,
                data: { name: "Curious Mind", icon: "🎓", description: "Completed your first resource" },
            },
            {
                id: "five_resources",
                condition: () => stats.totalCompleted >= 5,
                data: { name: "Learning Enthusiast", icon: "📚", description: "Completed 5 resources" },
            },
            {
                id: "ten_resources",
                condition: () => stats.totalCompleted >= 10,
                data: { name: "Dedicated Scholar", icon: "🔬", description: "Completed 10 resources" },
            },
            {
                id: "first_certificate",
                condition: () => stats.totalCertificates >= 1,
                data: { name: "Certified Expert", icon: "🏆", description: "Earned your first certificate" },
            },
            {
                id: "five_skills",
                condition: () => stats.totalSkills >= 5,
                data: { name: "Multi-Skilled", icon: "🎯", description: "Acquired 5 skills" },
            },
            {
                id: "100_hours",
                condition: () => stats.totalLearningHours >= 100,
                data: { name: "Dedicated Learner", icon: "🔥", description: "100+ hours of learning" },
            },
        ];

        // Award applicable achievements
        for (const check of achievementChecks) {
            if (check.condition()) {
                await awardAchievement(studentId, {
                    id: check.id,
                    ...check.data,
                });
            }
        }
    } catch (error) {
        console.error("[CareerPortfolioService] Error checking achievements:", error);
    }
}

/**
 * Check if cache entry is still valid
 * @private
 */
function isValidCache(timestamp) {
    return Date.now() - timestamp < CACHE_TTL;
}

/**
 * Clear portfolio cache
 */
export function clearPortfolioCache(studentId) {
    if (studentId) {
        delete cache[studentId];
    } else {
        cache = {};
    }
}

export default {
    getCareerPortfolio,
    getCompletedResources,
    getEarnedCertificates,
    getAcquiredSkills,
    getAchievements,
    addCompletedResource,
    awardCertificate,
    addSkill,
    awardAchievement,
    clearPortfolioCache,
};
