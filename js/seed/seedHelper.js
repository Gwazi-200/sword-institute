/**
 * ============================================================
 * Sword Institute LMS
 * Seed Helper Utilities
 * Version: 1.0.0
 * ============================================================
 *
 * Utilities for seeding and managing test data.
 *
 * Features:
 * - Progress tracking for batch uploads
 * - Error recovery and retry logic
 * - Data validation before upload
 * - Batch size management
 * - Logging and reporting
 *
 * ============================================================
 */

import {
    db,
    collection,
    deleteDoc,
    getDocs,
    query,
    limit,
    doc,
} from "../firebase.js";

/* ============================================================
   CONSTANTS
============================================================ */

const BATCH_SIZE = 25; // Firestore batch limit
const UPLOAD_DELAY = 500; // ms between batches

/* ============================================================
   PROGRESS TRACKING
============================================================ */

class SeederProgress {
    constructor(total) {
        this.total = total;
        this.uploaded = 0;
        this.failed = 0;
        this.startTime = Date.now();
        this.errors = [];
    }

    addUploaded(count = 1) {
        this.uploaded += count;
    }

    addFailed(error) {
        this.failed += 1;
        this.errors.push(error);
    }

    getProgress() {
        return {
            total: this.total,
            uploaded: this.uploaded,
            failed: this.failed,
            percentage: Math.round((this.uploaded / this.total) * 100),
            elapsedSeconds: Math.round((Date.now() - this.startTime) / 1000),
            errors: this.errors,
        };
    }

    log() {
        const p = this.getProgress();
        console.log(
            `📊 Progress: ${p.uploaded}/${p.total} (${p.percentage}%) - Elapsed: ${p.elapsedSeconds}s`
        );
        if (p.failed > 0) {
            console.warn(`⚠️  Failed: ${p.failed}`);
        }
    }
}

/* ============================================================
   BATCH OPERATIONS
============================================================ */

/**
 * Validate resource data before upload
 * @param {Object} resource - Resource to validate
 * @returns {Object} { valid: boolean, errors: string[] }
 */
function validateResource(resource) {
    const errors = [];

    // Required fields
    const required = ["title", "type", "difficulty", "academy", "author"];
    required.forEach(field => {
        if (!resource[field]) {
            errors.push(`Missing required field: ${field}`);
        }
    });

    // Type validation
    const validTypes = [
        "book",
        "video",
        "paper",
        "podcast",
        "article",
        "template",
        "toolkit",
        "case-study",
        "download",
    ];
    if (resource.type && !validTypes.includes(resource.type)) {
        errors.push(`Invalid type: ${resource.type}`);
    }

    // Difficulty validation
    const validDifficulties = ["beginner", "intermediate", "advanced", "expert"];
    if (resource.difficulty && !validDifficulties.includes(resource.difficulty)) {
        errors.push(`Invalid difficulty: ${resource.difficulty}`);
    }

    // Rating validation
    if (resource.rating !== undefined && (resource.rating < 0 || resource.rating > 5)) {
        errors.push(`Invalid rating: ${resource.rating}`);
    }

    // Time validation
    if (resource.estimatedTime !== undefined && resource.estimatedTime < 0) {
        errors.push(`Invalid estimatedTime: ${resource.estimatedTime}`);
    }

    return {
        valid: errors.length === 0,
        errors,
    };
}

/**
 * Validate batch of resources
 * @param {Array} resources - Resources to validate
 * @returns {Object} { valid: boolean, errors: string[], invalidCount: number }
 */
function validateResourceBatch(resources) {
    const errors = [];
    let invalidCount = 0;

    resources.forEach((resource, index) => {
        const validation = validateResource(resource);
        if (!validation.valid) {
            invalidCount++;
            validation.errors.forEach(err => {
                errors.push(`Resource ${index}: ${err}`);
            });
        }
    });

    return {
        valid: invalidCount === 0,
        errors,
        invalidCount,
    };
}

/* ============================================================
   COLLECTION MANAGEMENT
============================================================ */

/**
 * Get collection size
 * @param {string} collectionName - Collection name
 * @returns {Promise<number>} Document count
 */
async function getCollectionSize(collectionName) {
    try {
        const snapshot = await getDocs(collection(db, collectionName));
        return snapshot.size;
    } catch (error) {
        console.error(`Error getting collection size for ${collectionName}:`, error);
        throw error;
    }
}

/**
 * Delete all documents in collection (with limit for safety)
 * @param {string} collectionName - Collection name
 * @param {number} maxDelete - Maximum documents to delete (default 1000)
 * @returns {Promise<number>} Number deleted
 */
async function clearCollection(collectionName, maxDelete = 1000) {
    try {
        console.log(`🗑️  Clearing collection: ${collectionName}`);

        const q = query(collection(db, collectionName), limit(maxDelete));
        const snapshot = await getDocs(q);

        let deleted = 0;
        for (const doc of snapshot.docs) {
            await deleteDoc(doc.ref);
            deleted++;
        }

        console.log(`✅ Deleted ${deleted} documents from ${collectionName}`);
        return deleted;
    } catch (error) {
        console.error(`Error clearing collection ${collectionName}:`, error);
        throw error;
    }
}

/**
 * Delete subcollection documents (for privacy-scoped data)
 * @param {string} parentCollection - Parent collection
 * @param {string} parentDoc - Parent document ID
 * @param {string} subCollection - Subcollection name
 * @returns {Promise<number>} Number deleted
 */
async function clearSubcollection(parentCollection, parentDoc, subCollection) {
    try {
        console.log(
            `🗑️  Clearing subcollection: ${parentCollection}/${parentDoc}/${subCollection}`
        );

        const subRef = collection(db, parentCollection, parentDoc, subCollection);
        const snapshot = await getDocs(subRef);

        let deleted = 0;
        for (const doc of snapshot.docs) {
            await deleteDoc(doc.ref);
            deleted++;
        }

        console.log(`✅ Deleted ${deleted} documents`);
        return deleted;
    } catch (error) {
        console.error("Error clearing subcollection:", error);
        throw error;
    }
}

/* ============================================================
   REPORTING
============================================================ */

/**
 * Generate seed report
 * @param {SeederProgress} progress - Progress tracker
 * @returns {string} Formatted report
 */
function generateReport(progress) {
    const p = progress.getProgress();
    const status = p.failed === 0 ? "✅ SUCCESS" : "⚠️  PARTIAL";

    let report = `
╔════════════════════════════════════════════════════════════════╗
║                   📊 SEEDING REPORT                            ║
╠════════════════════════════════════════════════════════════════╣
║ Status:           ${status.padEnd(42)} ║
║ Total Resources:  ${String(p.total).padEnd(42)} ║
║ Uploaded:         ${String(p.uploaded).padEnd(42)} ║
║ Failed:           ${String(p.failed).padEnd(42)} ║
║ Success Rate:     ${`${p.percentage}%`.padEnd(42)} ║
║ Elapsed Time:     ${`${p.elapsedSeconds}s`.padEnd(42)} ║
╠════════════════════════════════════════════════════════════════╣
`;

    if (p.errors.length > 0) {
        report += `║ ERRORS:                                                          ║\n`;
        p.errors.slice(0, 5).forEach(error => {
            const msg = error.substring(0, 60);
            report += `║ • ${msg.padEnd(62)} ║\n`;
        });
        if (p.errors.length > 5) {
            report += `║ ... and ${(p.errors.length - 5).toString()} more errors\n`;
        }
    }

    report += `╚════════════════════════════════════════════════════════════════╝`;
    return report;
}

/* ============================================================
   UI FEEDBACK
============================================================ */

/**
 * Update UI progress display
 * @param {Object} options - Display options
 */
function updateProgressUI(options = {}) {
    const { percentage = 0, message = "", status = "uploading" } = options;

    // Try to update UI elements if they exist
    const progressBar = document.getElementById("seed-progress-bar");
    const progressText = document.getElementById("seed-progress-text");
    const statusText = document.getElementById("seed-status");

    if (progressBar) {
        progressBar.style.width = `${percentage}%`;
    }

    if (progressText) {
        progressText.textContent = `${percentage}%`;
    }

    if (statusText) {
        statusText.textContent = message;
        statusText.className = `status ${status}`;
    }

    console.log(`[${status.toUpperCase()}] ${message}`);
}

/**
 * Display completion message
 * @param {SeederProgress} progress - Progress tracker
 */
function displayCompletionMessage(progress) {
    const p = progress.getProgress();
    const report = generateReport(progress);

    console.log(report);

    const message = `
🎉 Seeding Complete!

Uploaded: ${p.uploaded}/${p.total} resources
Success Rate: ${p.percentage}%
Time Elapsed: ${p.elapsedSeconds}s

${p.failed > 0 ? `⚠️  ${p.failed} resources failed to upload\n\nCheck console for details.` : "✅ All resources uploaded successfully!\n\nYou can now test the Knowledge Hub."}
    `;

    alert(message);
    updateProgressUI({
        percentage: 100,
        message: "Seeding complete!",
        status: "success",
    });
}

/* ============================================================
   EXPORTS
============================================================ */

export {
    SeederProgress,
    validateResource,
    validateResourceBatch,
    getCollectionSize,
    clearCollection,
    clearSubcollection,
    generateReport,
    updateProgressUI,
    displayCompletionMessage,
};

export default {
    SeederProgress,
    validateResource,
    validateResourceBatch,
    getCollectionSize,
    clearCollection,
    clearSubcollection,
    generateReport,
    updateProgressUI,
    displayCompletionMessage,
};
