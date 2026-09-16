import type { PracticeSheetConfig } from '../components/instructor/PracticeSheetComposer';

// Preparation only: do not POST these draft fields to the current API.
export const DAN_TRANH_REMOTE_CONTENT_ENABLED = false;

/** Exact naming from supplied OpenAPI, not the editor's local state names. */
export interface LessonContentDto {
  id: number;
  content_text: string;
  order_index: number;
}
export interface UpdateLessonDto {
  title: string;
  description?: string;
  skill_level_id?: number;
  order_index?: number;
}
export interface DanTranhLessonIdentity {
  lessonId: number; // API id; not a local progress key.
  lessonCode: string; // Stable; must be mapped explicitly to existing app codes.
}

/** Proposed future practice payload. NOT an existing OpenAPI request. */
export interface DanTranhPracticeDraft {
  schemaVersion: 1;
  instrumentCode: 'dan_tranh';
  practiceConfig: PracticeSheetConfig;
}
export function makeDanTranhPracticeDraft(sheet: PracticeSheetConfig): DanTranhPracticeDraft {
  return { schemaVersion: 1, instrumentCode: 'dan_tranh', practiceConfig: structuredClone(sheet) };
}
export function teacherSpeechToRequest(contentText: string, orderIndex: number): Omit<LessonContentDto, 'id'> {
  if (!contentText.trim() || !Number.isInteger(orderIndex) || orderIndex < 1) throw new Error('Đoạn lời hoặc thứ tự không hợp lệ.');
  return { content_text: contentText.trim(), order_index: orderIndex };
}

// Visibility is NOT approval status and NOT deletion. Current OpenAPI has no
// visibility field/endpoint. Do not implement hide via DELETE or status edits.
export const LESSON_VISIBILITY_API_SUPPORTED = false;
