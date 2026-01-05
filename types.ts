// Domain Types

export interface UserData {
  uid: string;
  displayName: string;
  photoURL?: string;
  streak: number;
  lastPracticeDate: string; // ISO Date string
  history: Record<string, boolean>; // 'YYYY-MM-DD': true
  totalLessons: number;
}

export type LessonCategory = 'alphabet' | 'phrase' | 'custom';

export interface Lesson {
  id: string;
  category: LessonCategory;
  type: 'static' | 'dynamic'; // New field for assessment logic
  letter: string; // The display title (e.g., "A" or "Thank You")
  description: string;
  instruction?: string; // Step-by-step for complex signs
  imageUrl: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  visualGuide?: 'none' | 'motion_circle' | 'motion_shake' | 'motion_forward' | 'motion_up' | 'motion_nod';
}

export interface FeedbackResponse {
  score: number; // 0-100
  feedback: string;
  isCorrect: boolean;
}

// MediaPipe Types (Partial)
export interface Landmark {
  x: number;
  y: number;
  z: number;
}

export interface Results {
  multiHandLandmarks: Landmark[][];
  multiHandWorldLandmarks?: Landmark[][];
  image: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement;
}