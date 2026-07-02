// js/seedCourses.js – Sword Institute Database Seeder
// Imports only from firebase.js
import { db, doc, getDoc, writeBatch, serverTimestamp } from './firebase.js';

// ================================================================
// DATA DEFINITIONS
// ================================================================

const categoriesData = [
  {
    id: 'professional-skills',
    name: 'Professional Skills',
    slug: 'professional-skills',
    description: 'Develop core professional competencies for career growth and leadership.',
    icon: 'briefcase',
    color: '#7C3AED',
    displayOrder: 1,
    active: true,
  },
  {
    id: 'community-development',
    name: 'Community Development',
    slug: 'community-development',
    description: 'Empower communities with sustainable development and social impact skills.',
    icon: 'hands-helping',
    color: '#059669',
    displayOrder: 2,
    active: true,
  },
  {
    id: 'ai-education',
    name: 'AI Education',
    slug: 'ai-education',
    description: 'Learn artificial intelligence and machine learning to drive innovation.',
    icon: 'brain',
    color: '#2563EB',
    displayOrder: 3,
    active: true,
  },
  {
    id: 'wellbeing',
    name: 'Wellbeing',
    slug: 'wellbeing',
    description: 'Enhance mental health, psychosocial support, and holistic care skills.',
    icon: 'heart',
    color: '#DC2626',
    displayOrder: 4,
    active: true,
  },
];

const coursesData = [
  {
    courseId: 'COMM001',
    title: 'Communication Skills',
    slug: 'communication-skills',
    shortDescription: 'Master verbal, non-verbal, and written communication for professional success.',
    description: 'This course equips you with essential communication techniques to enhance your professional interactions, build stronger relationships, and lead with clarity.',
    category: 'professional-skills',
    subcategory: 'Soft Skills',
    level: 'beginner',
    language: 'English',
    duration: '3 hours',
    estimatedHours: 3,
    lessons: 12,
    rating: 4.5,
    students: 0,
    progress: 0,
    featured: false,
    popular: false,
    published: true,
    certificate: true,
    price: 0,
    currency: 'USD',
    thumbnail: '/images/courses/communication-thumb.jpg',
    image: '/images/courses/communication.jpg',
    banner: '/images/courses/communication-banner.jpg',
    instructor: 'Dr. Jane Mwangi',
    instructorTitle: 'Communication Specialist',
    skills: ['Active Listening', 'Public Speaking', 'Business Writing', 'Negotiation'],
    requirements: ['Basic literacy', 'Willingness to practice'],
    modules: [
      { title: 'Introduction to Communication', lessons: 3 },
      { title: 'Verbal Communication', lessons: 3 },
      { title: 'Non-Verbal Communication', lessons: 2 },
      { title: 'Written Communication', lessons: 2 },
      { title: 'Communication in Teams', lessons: 2 },
    ],
    tags: ['communication', 'soft skills', 'professional', 'leadership'],
  },
  {
    courseId: 'ADMIN001',
    title: 'Administration & Management',
    slug: 'administration-management',
    shortDescription: 'Learn effective administration and management practices for organizations.',
    description: 'This course covers essential management principles, administrative functions, and leadership strategies to run efficient teams and operations.',
    category: 'professional-skills',
    subcategory: 'Management',
    level: 'intermediate',
    language: 'English',
    duration: '4 hours',
    estimatedHours: 4,
    lessons: 16,
    rating: 4.2,
    students: 0,
    progress: 0,
    featured: false,
    popular: false,
    published: true,
    certificate: true,
    price: 0,
    currency: 'USD',
    thumbnail: '/images/courses/admin-thumb.jpg',
    image: '/images/courses/admin.jpg',
    banner: '/images/courses/admin-banner.jpg',
    instructor: 'Mr. Samuel Kiprop',
    instructorTitle: 'Management Consultant',
    skills: ['Strategic Planning', 'Team Management', 'Budgeting', 'Performance Evaluation'],
    requirements: ['Basic understanding of business operations', 'Leadership interest'],
    modules: [
      { title: 'Principles of Management', lessons: 4 },
      { title: 'Administrative Functions', lessons: 4 },
      { title: 'Team Leadership', lessons: 4 },
      { title: 'Performance Management', lessons: 4 },
    ],
    tags: ['administration', 'management', 'leadership', 'organizational'],
  },
  {
    courseId: 'ENT001',
    title: 'Entrepreneurship',
    slug: 'entrepreneurship',
    shortDescription: 'Turn your ideas into a successful business venture.',
    description: 'This course provides the entrepreneurial mindset, business planning, and practical steps to launch and sustain a business.',
    category: 'professional-skills',
    subcategory: 'Business',
    level: 'beginner',
    language: 'English',
    duration: '2.5 hours',
    estimatedHours: 2.5,
    lessons: 10,
    rating: 4.6,
    students: 0,
    progress: 0,
    featured: true,
    popular: true,
    published: true,
    certificate: true,
    price: 0,
    currency: 'USD',
    thumbnail: '/images/courses/ent-thumb.jpg',
    image: '/images/courses/ent.jpg',
    banner: '/images/courses/ent-banner.jpg',
    instructor: 'Prof. Grace Ochieng',
    instructorTitle: 'Entrepreneurship Educator',
    skills: ['Business Planning', 'Marketing', 'Financial Management', 'Innovation'],
    requirements: ['No prior business knowledge required', 'Open mindset'],
    modules: [
      { title: 'Entrepreneurial Mindset', lessons: 2 },
      { title: 'Business Ideation', lessons: 2 },
      { title: 'Business Planning', lessons: 3 },
      { title: 'Launch and Growth', lessons: 3 },
    ],
    tags: ['entrepreneurship', 'startup', 'business', 'innovation'],
  },
  {
    courseId: 'CBO001',
    title: 'Community Based Organisations',
    slug: 'community-based-organisations',
    shortDescription: 'Effectively manage and lead community-based organisations.',
    description: 'Learn the principles of community development, governance, and project management to strengthen CBOs and maximize social impact.',
    category: 'community-development',
    subcategory: 'NGO Management',
    level: 'intermediate',
    language: 'English',
    duration: '3 hours',
    estimatedHours: 3,
    lessons: 14,
    rating: 4.0,
    students: 0,
    progress: 0,
    featured: false,
    popular: false,
    published: true,
    certificate: true,
    price: 0,
    currency: 'USD',
    thumbnail: '/images/courses/cbo-thumb.jpg',
    image: '/images/courses/cbo.jpg',
    banner: '/images/courses/cbo-banner.jpg',
    instructor: 'Mr. John Mwangi',
    instructorTitle: 'Community Development Expert',
    skills: ['Community Mobilization', 'Project Management', 'Governance', 'Fundraising'],
    requirements: ['Experience with community work is helpful but not required'],
    modules: [
      { title: 'Understanding CBOs', lessons: 3 },
      { title: 'Governance and Leadership', lessons: 3 },
      { title: 'Project Design and Implementation', lessons: 4 },
      { title: 'Monitoring and Evaluation', lessons: 4 },
    ],
    tags: ['CBO', 'community development', 'NGO', 'social impact'],
  },
  {
    courseId: 'HBC001',
    title: 'Home Based Care',
    slug: 'home-based-care',
    shortDescription: 'Provide compassionate and effective care in home settings.',
    description: 'This course prepares you to deliver home-based care with empathy, safety, and professionalism, covering basic healthcare, nutrition, and emotional support.',
    category: 'wellbeing',
    subcategory: 'Healthcare',
    level: 'beginner',
    language: 'English',
    duration: '2 hours',
    estimatedHours: 2,
    lessons: 8,
    rating: 4.1,
    students: 0,
    progress: 0,
    featured: false,
    popular: false,
    published: true,
    certificate: true,
    price: 0,
    currency: 'USD',
    thumbnail: '/images/courses/hbc-thumb.jpg',
    image: '/images/courses/hbc.jpg',
    banner: '/images/courses/hbc-banner.jpg',
    instructor: 'Nurse Grace Atieno',
    instructorTitle: 'Clinical Nurse Educator',
    skills: ['Basic Nursing Care', 'Nutrition', 'Patient Communication', 'Infection Control'],
    requirements: ['Compassion and willingness to help others'],
    modules: [
      { title: 'Introduction to Home Care', lessons: 2 },
      { title: 'Basic Nursing Skills', lessons: 2 },
      { title: 'Nutrition and Hygiene', lessons: 2 },
      { title: 'Emotional Support', lessons: 2 },
    ],
    tags: ['home care', 'healthcare', 'caregiving', 'wellness'],
  },
  {
    courseId: 'CHILD001',
    title: 'Child Welfare Programmes',
    slug: 'child-welfare-programmes',
    shortDescription: 'Protect and promote the well-being of children through effective programmes.',
    description: 'Gain knowledge and skills to design, implement, and evaluate child welfare programmes that safeguard children rights and development.',
    category: 'community-development',
    subcategory: 'Child Protection',
    level: 'intermediate',
    language: 'English',
    duration: '4 hours',
    estimatedHours: 4,
    lessons: 15,
    rating: 4.7,
    students: 0,
    progress: 0,
    featured: true,
    popular: true,
    published: true,
    certificate: true,
    price: 0,
    currency: 'USD',
    thumbnail: '/images/courses/child-thumb.jpg',
    image: '/images/courses/child.jpg',
    banner: '/images/courses/child-banner.jpg',
    instructor: 'Ms. Aisha Wanjiru',
    instructorTitle: 'Child Protection Specialist',
    skills: ['Child Rights', 'Programme Design', 'Case Management', 'Advocacy'],
    requirements: ['Interest in child welfare and protection'],
    modules: [
      { title: 'Understanding Child Rights', lessons: 3 },
      { title: 'Child Welfare Policy', lessons: 3 },
      { title: 'Programme Implementation', lessons: 4 },
      { title: 'Monitoring and Reporting', lessons: 5 },
    ],
    tags: ['child welfare', 'child protection', 'social work', 'community'],
  },
  {
    courseId: 'AI001',
    title: 'AI Basic Education',
    slug: 'ai-basic-education',
    shortDescription: 'Introduction to artificial intelligence concepts and applications.',
    description: 'This course demystifies AI, covering fundamental concepts, machine learning, and practical applications in everyday life and business.',
    category: 'ai-education',
    subcategory: 'Foundational AI',
    level: 'beginner',
    language: 'English',
    duration: '5 hours',
    estimatedHours: 5,
    lessons: 20,
    rating: 4.8,
    students: 0,
    progress: 0,
    featured: true,
    popular: true,
    published: true,
    certificate: true,
    price: 0,
    currency: 'USD',
    thumbnail: '/images/courses/ai-thumb.jpg',
    image: '/images/courses/ai.jpg',
    banner: '/images/courses/ai-banner.jpg',
    instructor: 'Dr. David Kariuki',
    instructorTitle: 'AI Researcher',
    skills: ['Machine Learning Basics', 'Python Fundamentals', 'Data Analysis', 'AI Ethics'],
    requirements: ['Basic computer literacy', 'Curiosity about AI'],
    modules: [
      { title: 'What is AI?', lessons: 3 },
      { title: 'Machine Learning Foundations', lessons: 4 },
      { title: 'AI in Practice', lessons: 5 },
      { title: 'Ethical AI', lessons: 4 },
      { title: 'Hands-on Project', lessons: 4 },
    ],
    tags: ['AI', 'machine learning', 'technology', 'education'],
  },
  {
    courseId: 'PSY001',
    title: 'Psychosocial Support',
    slug: 'psychosocial-support',
    shortDescription: 'Provide psychological and social support to individuals and communities.',
    description: 'Learn to deliver psychosocial support in crisis and development settings, covering counseling, community healing, and self-care.',
    category: 'wellbeing',
    subcategory: 'Mental Health',
    level: 'beginner',
    language: 'English',
    duration: '3.5 hours',
    estimatedHours: 3.5,
    lessons: 13,
    rating: 4.3,
    students: 0,
    progress: 0,
    featured: false,
    popular: false,
    published: true,
    certificate: true,
    price: 0,
    currency: 'USD',
    thumbnail: '/images/courses/psy-thumb.jpg',
    image: '/images/courses/psy.jpg',
    banner: '/images/courses/psy-banner.jpg',
    instructor: 'Dr. Sarah Omondi',
    instructorTitle: 'Clinical Psychologist',
    skills: ['Active Listening', 'Crisis Intervention', 'Group Facilitation', 'Self-Care'],
    requirements: ['Empathy and willingness to help others'],
    modules: [
      { title: 'Understanding Psychosocial Support', lessons: 3 },
      { title: 'Core Counseling Skills', lessons: 3 },
      { title: 'Group and Community Interventions', lessons: 3 },
      { title: 'Self-Care for Helpers', lessons: 2 },
      { title: 'Case Management', lessons: 2 },
    ],
    tags: ['psychosocial', 'mental health', 'counseling', 'support'],
  },
];

// ================================================================
// HELPER FUNCTIONS
// ================================================================

function createCategoryDoc(category) {
  return {
    ...category,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
}

function createCourseDoc(course) {
  return {
    ...course,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
}

// ================================================================
// MAIN SEED FUNCTION
// ================================================================

export async function seedCourses() {
  console.log('🚀 Starting Sword Institute Database Seed...');
  const batch = writeBatch(db);
  let newDocsCount = 0;

  try {
    // ---- Categories ----
    console.log('📂 Checking categories...');
    for (const cat of categoriesData) {
      const docRef = doc(db, 'categories', cat.id);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        console.log(`⏭ Category already exists: ${cat.name}`);
      } else {
        batch.set(docRef, createCategoryDoc(cat));
        newDocsCount++;
        console.log(`✅ Category created: ${cat.name}`);
      }
    }

    // ---- Courses ----
    console.log('📚 Checking courses...');
    for (const course of coursesData) {
      const docRef = doc(db, 'courses', course.courseId);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        console.log(`⏭ Course already exists: ${course.title}`);
      } else {
        batch.set(docRef, createCourseDoc(course));
        newDocsCount++;
        console.log(`✅ Course created: ${course.title}`);
      }
    }

    // ---- Commit ----
    if (newDocsCount > 0) {
      console.log('💾 Committing batch...');
      await batch.commit();
      console.log(`🎉 Database successfully seeded. ${newDocsCount} new documents created.`);
    } else {
      console.log('🎉 Database already up to date. No changes made.');
    }
  } catch (error) {
    console.error('❌ Seed failed.');
    console.error(error);
    throw error;
  }
}

// ================================================================
// AUTO-EXECUTE
// ================================================================

seedCourses().catch(() => {
  // error already logged
});