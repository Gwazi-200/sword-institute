# Firestore Schema

## Overview
Firestore is the primary data store for Sword Institute. It is used to manage learners, course content, learning progress, certificates, mentor interactions, announcements, payments, and gamified engagement features.

The schema is designed to be modular, scalable, and secure while remaining simple enough for a production-grade client-side application.

## Collection Design Principles
- Use one document per logical entity
- Prefer stable, meaningful document IDs
- Use timestamps for auditability and ordering
- Keep relationships explicit through document references or IDs
- Restrict access with Firestore security rules
- Separate operational data from learner-facing content where appropriate

## Collections

### 1. students
Purpose:
Stores learner profile and account information for each student.

Fields:
- uid: string — Firebase Auth user ID
- fullName: string
- email: string
- phone: string
- country: string
- role: string — default: student
- status: string — active, suspended, archived
- createdAt: timestamp
- updatedAt: timestamp
- lastLoginAt: timestamp
- learningStreak: number
- progress: number — overall progress percentage
- coursesCompleted: number
- currentCourseId: string
- certificateCount: number
- photoURL: string
- preferences: map
  - dailyStudyGoal: number
  - preferredTime: string
  - notifications: boolean

Relationships:
- One student can enroll in many courses
- One student can have many progress documents
- One student can receive many certificates
- One student can have many mentor messages and notifications

Indexes:
- email
- status
- createdAt
- country

Security considerations:
- Only authenticated users should read their own profile
- Admins may read all student records
- Students should not be able to modify role or other privileged fields

### 2. courses
Purpose:
Stores the catalog of learning programs and course metadata.

Fields:
- courseId: string
- title: string
- slug: string
- description: string
- category: string
- subcategory: string
- instructorId: string
- instructorName: string
- durationWeeks: number
- level: string
- thumbnailURL: string
- isActive: boolean
- isFeatured: boolean
- createdAt: timestamp
- updatedAt: timestamp
- tags: array<string>
- learningOutcomes: array<string>

Relationships:
- One course contains many lessons
- One course can have many quizzes and assignments
- Many students can enroll in one course
- One course can have many progress records and certificates

Indexes:
- category
- isActive
- isFeatured
- createdAt

Security considerations:
- Public read access may be allowed for published course metadata
- Only authorized users should update course content
- Avoid exposing unpublished or restricted courses to unauthorized users

### 3. lessons
Purpose:
Stores lesson-level content and structure within a course.

Fields:
- lessonId: string
- courseId: string
- title: string
- order: number
- type: string — video, article, quiz, assignment, mixed
- content: string
- mediaURL: string
- durationMinutes: number
- isPublished: boolean
- createdAt: timestamp
- updatedAt: timestamp

Relationships:
- Belongs to exactly one course
- May be referenced by progress records
- Can be linked to quizzes or assignments when relevant

Indexes:
- courseId + order
- isPublished

Security considerations:
- Published lessons can be publicly readable if course is public
- Draft or restricted lessons should be protected
- Prevent unauthorized edits to lesson content

### 4. quizzes
Purpose:
Stores quiz questions and metadata for course assessments.

Fields:
- quizId: string
- courseId: string
- lessonId: string
- title: string
- description: string
- questions: array<map>
- passingScore: number
- timeLimitMinutes: number
- isPublished: boolean
- createdAt: timestamp
- updatedAt: timestamp

Relationships:
- Belongs to one course and optionally one lesson
- Can be referenced by progress records after completion

Indexes:
- courseId
- lessonId
- isPublished

Security considerations:
- Read access should be limited to enrolled learners or authorized staff
- Only instructors or admins should create or edit quizzes

### 5. assignments
Purpose:
Stores assignment details and submission expectations.

Fields:
- assignmentId: string
- courseId: string
- lessonId: string
- title: string
- instructions: string
- dueDate: timestamp
- maxScore: number
- submissionType: string — file, text, link
- isPublished: boolean
- createdAt: timestamp
- updatedAt: timestamp

Relationships:
- Belongs to one course and optionally one lesson
- May be linked to student submissions in a separate workflow if expanded later

Indexes:
- courseId
- dueDate
- isPublished

Security considerations:
- Learners should only access assignments for their enrolled courses
- Instructor/admin editing permissions should be enforced

### 6. progress
Purpose:
Tracks learner advancement through lessons, quizzes, and assignments.

Fields:
- progressId: string
- studentId: string
- courseId: string
- lessonId: string
- itemType: string — lesson, quiz, assignment
- status: string — not-started, in-progress, completed, failed
- score: number
- completedAt: timestamp
- updatedAt: timestamp
- timeSpentMinutes: number

Relationships:
- Belongs to one student and one course
- May reference a lesson, quiz, or assignment
- Used to calculate completion and leaderboard progress

Indexes:
- studentId + courseId
- courseId + status
- updatedAt

Security considerations:
- Students should only read and update their own progress records
- Admins may view aggregated progress data

### 7. certificates
Purpose:
Stores learner certificates for completed courses or achievements.

Fields:
- certificateId: string
- studentId: string
- courseId: string
- title: string
- issuedAt: timestamp
- certificateURL: string
- score: number
- status: string — issued, revoked

Relationships:
- Issued to one student for one course or achievement
- May be tied to progress and completion milestones

Indexes:
- studentId
- courseId
- issuedAt

Security considerations:
- Students should be able to read their own certificates
- Admins should manage issuance and revocation

### 8. mentor_messages
Purpose:
Stores AI or human mentor interactions with learners.

Fields:
- messageId: string
- studentId: string
- senderType: string — student, mentor, ai
- direction: string — inbound, outbound
- message: string
- createdAt: timestamp
- threadId: string
- contextType: string — course, general, assessment
- contextId: string

Relationships:
- Belongs to one student
- May be grouped into conversation threads
- Can reference course or lesson context

Indexes:
- studentId + createdAt
- threadId

Security considerations:
- Learners should only access their own mentor conversation records
- AI-generated messages should be logged but not expose sensitive internal logic

### 9. announcements
Purpose:
Stores platform-wide or course-specific announcements.

Fields:
- announcementId: string
- title: string
- body: string
- audience: string — all, students, instructors, admins
- courseId: string
- createdAt: timestamp
- expiresAt: timestamp
- isActive: boolean
- createdBy: string

Relationships:
- Can be linked to one course or used globally
- May trigger notifications for users

Indexes:
- audience + isActive
- createdAt
- courseId

Security considerations:
- Only authorized administrators or instructors should create announcements
- Public-facing content should be sanitized before display

### 10. notifications
Purpose:
Stores system notifications for learners and staff.

Fields:
- notificationId: string
- recipientId: string
- title: string
- body: string
- type: string — announcement, reminder, achievement, payment, system
- isRead: boolean
- createdAt: timestamp
- actionURL: string

Relationships:
- Sent to one recipient user
- Can be triggered by announcements, badges, certificates, or payments

Indexes:
- recipientId + isRead
- createdAt

Security considerations:
- Users should only read their own notifications
- Avoid storing sensitive payment or personal data in notification bodies

### 11. leaderboard
Purpose:
Stores rankings and engagement metrics for gamified learning experiences.

Fields:
- leaderboardId: string
- studentId: string
- courseId: string
- score: number
- rank: number
- period: string — weekly, monthly, all-time
- updatedAt: timestamp

Relationships:
- One student can appear in multiple leaderboard periods
- May be tied to specific courses or overall platform activity

Indexes:
- courseId + period + rank
- studentId + period

Security considerations:
- Leaderboard data can be public or semi-public depending on policy
- Personal ranking details should be limited to the owner unless explicitly intended for display

### 12. badges
Purpose:
Stores badge definitions and learner achievements.

Fields:
- badgeId: string
- title: string
- description: string
- iconURL: string
- criteria: string
- pointsRequired: number
- isActive: boolean

Relationships:
- Badges can be awarded to students over time
- A student may earn many badges

Indexes:
- isActive
- pointsRequired

Security considerations:
- Badge metadata can be public if intended for learner motivation
- Awarding a badge should be restricted to trusted admin or automated logic

### 13. payments
Purpose:
Stores payment transactions and billing records for paid courses or services.

Fields:
- paymentId: string
- studentId: string
- courseId: string
- amount: number
- currency: string
- status: string — pending, completed, failed, refunded
- provider: string — stripe, paypal, manual
- referenceId: string
- createdAt: timestamp
- updatedAt: timestamp

Relationships:
- Linked to one student and optionally one course
- Can be used to unlock access or verify enrollment eligibility

Indexes:
- studentId
- status
- createdAt

Security considerations:
- Payment data should be handled carefully and never exposed broadly
- Store only necessary metadata in Firestore; sensitive payment details should be handled by a secure processor

## Recommended Naming Conventions
- Use plural collection names in lowercase snake_case
- Use stable IDs such as courseId, studentId, lessonId, and paymentId
- Use timestamps for createdAt, updatedAt, issuedAt, and completedAt

## Recommended Indexes Summary
The most important composite indexes to support in production are:
- students: email, status, createdAt
- courses: category, isActive, isFeatured, createdAt
- lessons: courseId + order, isPublished
- progress: studentId + courseId, courseId + status, updatedAt
- notifications: recipientId + isRead, createdAt
- leaderboard: courseId + period + rank

## Security Rules Guidance
Recommended rule principles:
- Students can read and update only their own profile and progress records
- Instructors and admins can manage course content and learner progress as appropriate
- Public content like course metadata may be readable by all users
- Private content should be restricted with authentication checks
- Payment and sensitive records should be limited to authorized roles
