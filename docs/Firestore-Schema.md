# Firestore Schema

## Overview
Firestore is used to store user and learning-related data for Sword Institute. The schema should remain simple, flexible, and scalable as new features are introduced.

## Suggested Collections

### users
Stores profile and account information for each user.

Fields:
- uid: string
- fullName: string
- email: string
- role: string
- createdAt: timestamp
- updatedAt: timestamp

### courses
Stores course metadata and content references.

Fields:
- id: string
- title: string
- description: string
- category: string
- instructor: string
- createdAt: timestamp
- isActive: boolean

### enrollments
Tracks the relationship between a user and a course.

Fields:
- userId: string
- courseId: string
- enrolledAt: timestamp
- progress: number
- completed: boolean

### progress
Stores detailed learner progress for content activities.

Fields:
- userId: string
- courseId: string
- lessonId: string
- status: string
- updatedAt: timestamp

### mentorSessions
Stores AI or human mentor interactions if the platform expands into guided support workflows.

Fields:
- userId: string
- sessionType: string
- createdAt: timestamp
- summary: string
- status: string

## Design Notes
- Keep document structures shallow and predictable
- Use timestamps for auditability and reporting
- Add indexes and rules as the data model grows
- Avoid storing sensitive information in client-accessible collections without strong security rules
