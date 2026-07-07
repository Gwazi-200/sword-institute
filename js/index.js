/**
 * ==========================================================
 * Sword Institute LMS
 * Homepage Controller
 * Version 1.0
 * ==========================================================
 */

console.clear();

console.log(`
==========================================
⚔ Sword Institute Homepage
Version 1.0
==========================================
`);

/* ==========================================================
   ELEMENTS
========================================================== */

const dashboardButton = document.getElementById("dashboardButton");

const counters = document.querySelectorAll(".counter");

const mentorCard = document.querySelector(".mentor-card");

/* ==========================================================
   AUTH PLACEHOLDER
========================================================== */

function checkAuthentication() {

    /*
     This will later use Firebase Authentication.

     if(user){

        dashboardButton.style.display="inline-flex";

     }else{

        dashboardButton.style.display="none";

     }

    */

    dashboardButton.style.display = "none";

}

checkAuthentication();

/* ==========================================================
   HERO BUTTONS
========================================================== */

document.querySelectorAll(".btn").forEach(button => {

    button.addEventListener("mouseenter", () => {

        button.style.transform = "translateY(-3px)";

    });

    button.addEventListener("mouseleave", () => {

        button.style.transform = "";

    });

});

/* ==========================================================
   MENTOR FLOATING EFFECT
========================================================== */

if (mentorCard) {

    let direction = 1;

    setInterval(() => {

        mentorCard.style.transform =
            `translateY(${direction * 8}px)`;

        direction *= -1;

    }, 2000);

}

/* ==========================================================
   COUNTER ANIMATION
========================================================== */

function animateCounter(counter) {

    const target = Number(counter.dataset.target);

    let current = 0;

    const speed = target / 120;

    function update() {

        current += speed;

        if (current < target) {

            counter.innerText = Math.floor(current);

            requestAnimationFrame(update);

        } else {

            counter.innerText = target.toLocaleString();

        }

    }

    update();

}

/* ==========================================================
   OBSERVER
========================================================== */

const observer = new IntersectionObserver(entries => {

    entries.forEach(entry => {

        if (entry.isIntersecting) {

            if (entry.target.classList.contains("counter")) {

                animateCounter(entry.target);

            }

            entry.target.classList.add("visible");

        }

    });

}, {

    threshold: .25

});

document.querySelectorAll(".animate").forEach(element => {

    observer.observe(element);

});

document.querySelectorAll(".counter").forEach(counter => {

    observer.observe(counter);

});

/* ==========================================================
   SMOOTH SCROLL
========================================================== */

document.querySelectorAll('a[href^="#"]').forEach(anchor => {

    anchor.addEventListener("click", e => {

        e.preventDefault();

        const target = document.querySelector(anchor.getAttribute("href"));

        if (!target) return;

        target.scrollIntoView({

            behavior: "smooth"

        });

    });

});

/* ==========================================================
    Professor SWORD Rotation
========================================================== */

const mentorMessages = [

    {

        title: "Communication Skills",

        text: "Every great leader begins by listening."

    },

    {

        title: "Leadership",

        text: "Lead with integrity and inspire others."

    },

    {

        title: "AI Basic Education",

        text: "AI is your assistant—not your replacement."

    },

    {

        title: "Entrepreneurship",

        text: "Every successful business starts with one idea."

    },

    {

        title: "Community Development",

        text: "Communities grow when knowledge is shared."

    }

];

const mentorTitle = document.querySelector(".mentor-message h2");

const mentorTip = document.querySelector(".mentor-tip");

let current = 0;

function rotateMentorMessage() {

    if (!mentorTitle || !mentorTip) return;

    current++;

    if (current >= mentorMessages.length)

        current = 0;

    mentorTitle.textContent = mentorMessages[current].title;

    mentorTip.textContent = "💡 " + mentorMessages[current].text;

}

setInterval(rotateMentorMessage, 7000);

/* ==========================================================
   SCROLL INDICATOR
========================================================== */

const indicator = document.querySelector(".scroll-indicator");

window.addEventListener("scroll", () => {

    if (window.scrollY > 150) {

        indicator.style.opacity = "0";

    }

    else {

        indicator.style.opacity = "1";

    }

});

/* ==========================================================
   PRELOADER PLACEHOLDER
========================================================== */

window.addEventListener("load", () => {

    document.body.classList.add("loaded");

});

/* ==========================================================
   FIREBASE PLACEHOLDER
========================================================== */

/*

NEXT VERSION

import {

auth,

onAuthStateChanged

}

from "./firebase.js";

onAuthStateChanged(auth,(user)=>{

if(user){

dashboardButton.style.display="inline-flex";

}else{

dashboardButton.style.display="none";

}

});

*/

/* ==========================================================
   END
========================================================== */

console.log("✅ Homepage Ready");