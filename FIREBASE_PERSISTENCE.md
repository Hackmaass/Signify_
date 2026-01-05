# Firebase Persistence & Tracking Guide

## Overview
All user progress and data is now persisted to Firebase Firestore with real-time synchronization. The system uses Firestore as the primary database with localStorage as a backup fallback.

## Firestore Structure

### Main User Document
**Path:** `users/{uid}`

```typescript
{
  uid: string;
  displayName: string;
  photoURL?: string;
  streak: number;
  lastPracticeDate: string; // ISO Date string
  totalLessons: number;
  history: Record<string, boolean>; // 'YYYY-MM-DD': true
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### Lesson Completions (Subcollection)
**Path:** `users/{uid}/completions/{completionId}`

Tracks each lesson completion with:
```typescript
{
  lessonId: string;
  lessonCategory: 'alphabet' | 'phrase' | 'custom';
  score: number; // 0-100
  completedAt: Timestamp;
  timestamp: string; // ISO Date string
}
```

### User Actions (Subcollection)
**Path:** `users/{uid}/actions/{actionId}`

Tracks all user interactions:
```typescript
{
  action: string; // 'lesson_started', 'lesson_completed', 'tab_changed', etc.
  metadata: Record<string, any>; // Additional context
  timestamp: Timestamp;
  createdAt: string; // ISO Date string
}
```

## Tracked Actions

1. **lesson_started** - When user begins a lesson
   - Metadata: `lessonId`, `lessonCategory`, `letter`

2. **lesson_completed** - When user successfully completes a lesson
   - Metadata: `lessonId`, `lessonCategory`, `score`, `letter`

3. **lesson_attempt_failed** - When user fails a lesson attempt
   - Metadata: `lessonId`, `lessonCategory`, `score`, `letter`

4. **lesson_generated** - When user generates custom lessons
   - Metadata: `input` (the phrase they entered)

5. **lesson_generation_success** - When custom lesson generation succeeds
   - Metadata: `input`, `lessonCount`

6. **tab_changed** - When user switches between tabs
   - Metadata: `tab` ('alphabet', 'phrase', 'custom')

## Real-Time Features

- **Real-time synchronization**: User data updates automatically across all devices
- **Offline support**: localStorage backup ensures data isn't lost
- **Automatic sync**: When user comes back online, data syncs to Firestore

## Data Flow

1. User completes lesson → `updateStreak()` called
2. Data saved to Firestore → `saveUserDataToFirestore()`
3. Completion tracked → `trackLessonCompletion()`
4. Action logged → `trackUserAction()`
5. Real-time listeners update UI automatically

## Firebase Setup Required

1. Enable Firestore Database in Firebase Console
2. Set up security rules (for production)
3. Collection structure will be created automatically on first use

## Benefits

- ✅ Persistent across devices
- ✅ Real-time updates
- ✅ Complete action tracking
- ✅ Analytics-ready data structure
- ✅ Offline fallback support

