/**
 * ==========================================================
 * Sword Institute LMS
 * Course Service
 * Version: 1.0.0
 * ==========================================================
 *
 * This service is the ONLY place that communicates
 * with the Firestore "courses" collection.
 *
 * UI pages must NEVER query Firestore directly.
 *
 * Homepage
 * Dashboard
 * Catalogue
 * Lesson Player
 * Admin Panel
 *
 * all use this service.
 * ==========================================================
 */

import {

    db,

    collection,

    query,

    where,

    orderBy,

    limit,

    getDocs

} from "../firebase.js";

/* ==========================================================
   COLLECTION
========================================================== */

const COURSE_COLLECTION = "courses";

/* ==========================================================
   HELPERS
========================================================== */

function courseCollection() {

    return collection(db, COURSE_COLLECTION);

}

/* ==========================================================
   GET FEATURED COURSES
========================================================== */

export async function getFeaturedCourses(max = 8) {

    try {

        console.log("📚 Loading featured courses...");

        const q = query(

            courseCollection(),

            where("featured", "==", true),

            where("published", "==", true),

            orderBy("createdAt", "desc"),

            limit(max)

        );

        const snapshot = await getDocs(q);

        const courses = [];

        snapshot.forEach(doc => {

            courses.push({

                id: doc.id,

                ...doc.data()

            });

        });

        console.log(`✅ ${courses.length} featured courses loaded.`);

        return courses;

    }

    catch (error) {

        console.error(

            "❌ Failed loading featured courses",

            error

        );

        return [];

    }

}

/* ==========================================================
   GET ALL COURSES
========================================================== */

export async function getAllCourses() {

    try {

        console.log("📚 Loading all courses...");

        const q = query(

            courseCollection(),

            where("published","==",true),

            orderBy("title")

        );

        const snapshot = await getDocs(q);

        const courses = [];

        snapshot.forEach(doc=>{

            courses.push({

                id:doc.id,

                ...doc.data()

            });

        });

        console.log(`✅ ${courses.length} courses loaded.`);

        return courses;

    }

    catch(error){

        console.error(error);

        return [];

    }

}

/* ==========================================================
   GET COURSES BY CATEGORY
========================================================== */

export async function getCoursesByCategory(category){

    try{

        const q=query(

            courseCollection(),

            where("category","==",category),

            where("published","==",true),

            orderBy("title")

        );

        const snapshot=await getDocs(q);

        const courses=[];

        snapshot.forEach(doc=>{

            courses.push({

                id:doc.id,

                ...doc.data()

            });

        });

        return courses;

    }

    catch(error){

        console.error(error);

        return[];

    }

}

/* ==========================================================
   SEARCH COURSES
========================================================== */

export async function searchCourses(){

    return getAllCourses();

}

/* ==========================================================
   VERSION
========================================================== */

console.log("📚 Course Service Loaded");