import type { UserProfile } from './management';

type EditableLesson = { status?: string; approvalStatus?: string; createdBy?: { id: number }; createdById?: number };

// Giáo trình chuẩn được seed ở trạng thái APPROVED và cần được biên soạn tiếp
// (bài tập, quiz, minigame) ngay trên web. Quyền ghi thực tế vẫn phải do API
// kiểm tra theo phạm vi instructor được phân công.
export function canEditLesson(user: Pick<UserProfile, 'id' | 'role'> | null | undefined, lesson: EditableLesson | null | undefined): boolean {
  return !!user && !!lesson && user.role === 'INSTRUCTOR';
}
