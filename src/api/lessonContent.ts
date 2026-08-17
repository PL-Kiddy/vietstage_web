import { apiRequest } from './client';

export interface Exercise {
  id: number;
  lessonId: number;
  title: string;
  description?: string;
  beatMapAssetId?: number;
  passThreshold?: number;
  orderIndex: number;
}

export interface ExerciseInput {
  title: string;
  description?: string;
  beatMapAssetId?: number;
  passThreshold?: number;
  orderIndex: number;
}

export type QuizQuestionType = 'NOTE_IDENTIFICATION' | 'GENERAL';

export interface Quiz {
  id: number;
  title: string;
  questionType: QuizQuestionType;
  note?: string;
  audioUrl?: string;
  question: string;
  options: string;
  correctAnswer?: string;
  orderIndex: number;
}

export interface QuizInput {
  title: string;
  questionType: QuizQuestionType;
  note?: string;
  audioUrl?: string;
  question: string;
  options: string;
  correctAnswer: string;
  orderIndex: number;
}

export type MinigameChallengeType = 'RHYTHM_MATCH' | 'MELODY_COMPLETE';

export interface Minigame {
  id: number;
  title: string;
  challengeType: MinigameChallengeType;
  difficulty?: string;
  maxScore: number;
  orderIndex: number;
  contentJson?: string;
  referenceAssetId?: number;
}

export interface MinigameInput {
  title: string;
  challengeType: MinigameChallengeType;
  contentJson?: string;
  referenceAssetId?: number;
  difficulty?: string;
  maxScore: number;
  orderIndex: number;
}

export interface MelodyCompleteConfig {
  audio_asset_id?: number;
  melody: string[];
  missing_positions: number[];
  note_options: Record<string, string[]>;
  correct_answers: Record<string, string>;
  bpm?: number;
  time_limit_sec?: number;
}

export const MELODY_COMPLETE_CONFIG: MelodyCompleteConfig = {
  melody: [],
  missing_positions: [],
  note_options: {},
  correct_answers: {},
};

// ── Bài tập (exercise): CRUD theo lesson ──
export const exercisesApi = {
  list: (lessonId: number) =>
    apiRequest<Exercise[]>(`/api/lessons/${lessonId}/exercises`),
  create: (lessonId: number, body: ExerciseInput) =>
    apiRequest<Exercise>(`/api/lessons/${lessonId}/exercises`, { method: 'POST', body }),
  update: (id: number, body: ExerciseInput) =>
    apiRequest<Exercise>(`/api/exercises/${id}`, { method: 'PUT', body }),
  remove: (id: number) => apiRequest<void>(`/api/exercises/${id}`, { method: 'DELETE' }),
};

// ── Quiz: CRUD theo lesson (options lưu dạng JSON string) ──
export const quizzesApi = {
  list: (lessonId: number) => apiRequest<Quiz[]>(`/api/lessons/${lessonId}/quizzes`),
  create: (lessonId: number, body: QuizInput) =>
    apiRequest<Quiz>(`/api/lessons/${lessonId}/quizzes`, { method: 'POST', body }),
  update: (id: number, body: QuizInput) =>
    apiRequest<Quiz>(`/api/quizzes/${id}`, { method: 'PUT', body }),
  remove: (id: number) => apiRequest<void>(`/api/quizzes/${id}`, { method: 'DELETE' }),
};

// ── Minigame (thử thách tương tác): CRUD theo lesson, cấu hình giai điệu lưu trong contentJson ──
export const minigamesApi = {
  list: (lessonId: number) =>
    apiRequest<Minigame[]>(`/api/lessons/${lessonId}/minigames`),
  create: (lessonId: number, body: MinigameInput) =>
    apiRequest<Minigame>(`/api/lessons/${lessonId}/minigames`, { method: 'POST', body }),
  update: (id: number, body: MinigameInput) =>
    apiRequest<Minigame>(`/api/minigames/${id}`, { method: 'PUT', body }),
  remove: (id: number) => apiRequest<void>(`/api/minigames/${id}`, { method: 'DELETE' }),
};