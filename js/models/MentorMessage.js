/**
 * ==========================================================
 * Sword Institute LMS
 * MentorMessage Model
 * Version 1.0
 * ==========================================================
 */

export default class MentorMessage {

    constructor(data = {}) {

        this.id = data.id || "";

        this.title = data.title || "";

        this.category = data.category || "general";

        this.message = data.message || "";

        this.course = data.course || "";

        this.level = data.level || "Beginner";

        this.icon = data.icon || "🤖";

        this.priority = data.priority ?? 1;

        this.active = data.active ?? true;

        this.createdAt = data.createdAt || null;

        this.updatedAt = data.updatedAt || null;

    }

    /**
     * Convert class to Firestore object
     */
    toFirestore() {

        return {

            title: this.title,

            category: this.category,

            message: this.message,

            course: this.course,

            level: this.level,

            icon: this.icon,

            priority: this.priority,

            active: this.active,

            createdAt: this.createdAt,

            updatedAt: this.updatedAt

        };

    }

    /**
     * Create class from Firestore
     */
    static fromFirestore(doc) {

        if (!doc.exists()) return null;

        return new MentorMessage({

            id: doc.id,

            ...doc.data()

        });

    }

    /**
     * Returns true if the message can be shown.
     */
    isActive() {

        return this.active === true;

    }

    /**
     * Returns formatted message.
     */
    formattedMessage(studentName = "Student") {

        return this.message.replace("{name}", studentName);

    }

}