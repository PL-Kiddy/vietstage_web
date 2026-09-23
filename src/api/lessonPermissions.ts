import type { UserProfile } from './management';

type EditableLesson = { status?: string; approvalStatus?: string; createdBy?: { id: number }; createdById?: number };

// Conservative UI policy until revision/re-review rules are specified by the API.
// Server authorization remains mandatory for every write.
export function canEditLesson(user: Pick<UserProfile, 'id' | 'role'> | null | undefined, lesson: EditableLesson | null | undefined): boolean {
  return !!user && !!lesson && user.role === 'INSTRUCTOR'
    && user.id === (lesson.createdBy?.id ?? lesson.createdById)
    && ['DRAFT', 'REJECTED'].includes(lesson.approvalStatus ?? lesson.status ?? '');
}
