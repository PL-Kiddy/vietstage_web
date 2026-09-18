import type { Lesson } from '../../api/types';
import PracticeStaffPreview from './PracticeStaffPreview';
import type { PracticeSheetEvent } from './PracticeSheetComposer';
import { parsePracticeSheet } from './practiceSheetStorage';

export default function ApiPracticePreview({ exercises }: { exercises: NonNullable<Lesson['exercises']> }) {
  return <section className="space-y-3"><h3 className="font-bold text-[#1D4532]">Thực hành</h3>
    {!exercises.length && <p className="text-sm">Chưa có bài tập thực hành.</p>}
    {[...exercises].sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0)).map(exercise => {
      const sheet = parsePracticeSheet(exercise.configJson);
      if (sheet) return <article key={exercise.id} className="space-y-3 rounded-xl border bg-white p-4"><h4 className="font-semibold">{exercise.title}</h4>{exercise.description && <p className="text-sm">{exercise.description}</p>}{exercise.passThreshold !== undefined && <p className="text-xs">Ngưỡng đạt: {exercise.passThreshold}</p>}{[...sheet.staffLines].sort((a,b) => a.order - b.order).map((line, index) => <div key={index} className="overflow-x-auto"><PracticeStaffPreview events={line.events} timeSignature={sheet.timeSignature} /></div>)}</article>;
      let config: Record<string, unknown> | null = null;
      let error = '';
      try { const parsed: unknown = exercise.configJson ? JSON.parse(exercise.configJson) : null; if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) config = parsed as Record<string, unknown>; else if (parsed !== null) error = 'Chưa thể hiển thị nội dung bài tập.'; } catch { error = 'Chưa thể hiển thị nội dung bài tập.'; }
      const rawNotes = config?.sheet ?? config?.noteSequence ?? config?.notes;
      const notes = Array.isArray(rawNotes) && rawNotes.every(note => typeof note === 'string') ? rawNotes as string[] : [];
      // Only render explicitly supplied notes. Technique-specific config is kept
      // visible below rather than inventing notes or silently discarding rounds.
      const events: PracticeSheetEvent[] = notes.map(note => ({ notes: note.split('+').map(n => n.trim().replace(/^ZT_/, '').replace('Đô', 'Do').replace('Rê', 'Re').replace(/^Rest$/i, 'REST')), duration: 'quarter', fingering: [], technique: 'none' }));
      return <article key={exercise.id} className="space-y-2 rounded-xl border bg-white p-4">
        <h4 className="font-semibold">{exercise.title}</h4><p className="text-xs text-on-surface-variant">{exercise.practiceMode || exercise.exerciseType || 'Chưa có loại thực hành'}{exercise.passThreshold !== undefined ? ` · Ngưỡng đạt: ${exercise.passThreshold}` : ''}</p>
        {exercise.description && <p className="text-sm">{exercise.description}</p>}
        {events.length > 0 && <><p className="text-xs text-on-surface-variant">Minh họa cao độ, chưa thể hiện đầy đủ trường độ và kỹ thuật.</p>{Array.from({ length: Math.ceil(events.length / 10) }, (_, i) => <div key={i} className="overflow-x-auto"><PracticeStaffPreview events={events.slice(i * 10, i * 10 + 10)} /></div>)}</>}
        {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
        {!config && !error && <p className="text-sm">Chưa có khuôn nhạc cho bài tập này.</p>}
      </article>;
    })}
  </section>;
}
