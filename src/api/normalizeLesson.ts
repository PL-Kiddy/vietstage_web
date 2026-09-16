import type { Lesson } from './types';

// Keep compatibility with older screens; approval and visibility are separate.
export function normalizeLesson(lesson: Lesson): Lesson {
  return { ...lesson, status: lesson.approvalStatus ?? lesson.status ?? 'DRAFT' };
}
