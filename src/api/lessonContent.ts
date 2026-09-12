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

export type RhythmEventMode = 'SAMPLE' | 'TARGET';

export interface RhythmEventConfig {
  note: string;
  mode: RhythmEventMode;
  /** Whole=4, half=2, quarter=1, eighth=.5, sixteenth=.25 beats. */
  duration_beats: number;
  /** Calculated from the round BPM for the player. */
  at_ms?: number;
  duration_ms?: number;
}

export interface RhythmRoundConfig {
  title?: string;
  tempo_bpm: number;
  events: RhythmEventConfig[];
  /** Legacy editor fields retained only while old saved drafts are supported. */
  beats: number[];
  notes: string[];
}

export interface RhythmMatchConfig {
  tempo_bpm?: number;
  beats: number[];
  audio_asset_id?: number;
  referenceAudioUrl?: string;
  rounds: RhythmRoundConfig[];
}

export const RHYTHM_MATCH_CONFIG: RhythmMatchConfig = {
  beats: [],
  rounds: [
    {
      title: 'Vòng 1',
      tempo_bpm: 100,
      beats: [],
      notes: [],
      events: [
        { note: 'Sol1', mode: 'SAMPLE', duration_beats: 1 },
        { note: 'La1', mode: 'TARGET', duration_beats: 1 },
      ],
    },
  ],
};

export interface MelodyCompleteConfig {
  audio_asset_id?: number;
  referenceAudioUrl?: string;
  melody: string[];
  /** Vị trí 0-based của nốt học viên sẽ chơi bằng nhạc cụ thật. */
  missing_index?: number;
  /** Legacy fields, retained only so existing challenges can still be edited. */
  missing_positions: number[];
  note_options: Record<string, string[]>;
  correct_answers: Record<string, string>;
  bpm?: number;
  time_limit_sec?: number;
}

export const MELODY_COMPLETE_CONFIG: MelodyCompleteConfig = {
  melody: [],
  missing_index: undefined,
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
