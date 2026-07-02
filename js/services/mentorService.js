/**
 * ==========================================================
 * Sword Institute LMS
 * Mentor Service
 * ==========================================================
 */

import {
    db,
    collection,
    getDocs
} from "../firebase.js";

import MentorMessage from "../models/MentorMessage.js";

const COLLECTION_NAME = "mentorMessages";

/**
 * Load all active mentor messages.
 */
export async function getMentorMessages() {

    try {

        const snapshot = await getDocs(collection(db, COLLECTION_NAME));

        const messages = [];

        snapshot.forEach(doc => {

            const mentor = MentorMessage.fromFirestore(doc);

            if (mentor && mentor.isActive()) {

                messages.push(mentor);

            }

        });

        return messages;

    } catch (error) {

        console.error("❌ Error loading mentor messages:", error);

        return [];

    }

}

/**
 * Get a random mentor message.
 */
export async function getRandomMessage() {

    const messages = await getMentorMessages();

    if (messages.length === 0) {

        return null;

    }

    const index = Math.floor(Math.random() * messages.length);

    return messages[index];

}

/**
 * Get messages for a specific course.
 */
export async function getCourseMessages(courseName) {

    const messages = await getMentorMessages();

    return messages.filter(

        message =>

        message.course === courseName ||

        message.category === "general"

    );

}