import type { Lesson } from '../../api/types';
import PracticeStaffPreview from './PracticeStaffPreview';
import type { PracticeSheetEvent } from './PracticeSheetComposer';

export default function ApiPracticePreview({ exercises }: { exercises: NonNullable<Lesson['exercises']> }) {
  return <section className="space-y-3"><h3 className="font-bold text-[#1D4532]">Thực hành từ API</h3>
    {!exercises.length && <p className="text-sm">Backend chưa trả bài tập thực hành cho bài này.</p>}
    {[...exercises].sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0)).map(exercise => {
      let config: Record<string, unknown> | null = null;
      let error = '';
      try { const parsed: unknown = exercise.configJson ? JSON.parse(exercise.configJson) : null; if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) config = parsed as Record<string, unknown>; else if (parsed !== null) error = 'Cấu hình không phải object.'; } catch { error = 'configJson không hợp lệ.'; }
      const rawNotes = config?.sheet ?? config?.noteSequence ?? config?.notes;
      const notes = Array.isArray(rawNotes) && rawNotes.every(note => typeof note === 'string') ? rawNotes as string[] : [];
      // Only render explicitly supplied notes. Technique-specific config is kept
      // visible below rather than inventing notes or silently discarding rounds.
      const events: PracticeSheetEvent[] = notes.map(note => ({ notes: note.split('+').map(n => n.trim().replace(/^ZT_/, '').replace('Đô', 'Do').replace('Rê', 'Re').replace(/^Rest$/i, 'REST')), duration: 'quarter', fingering: [], technique: 'none' }));
      return <article key={exercise.id} className="space-y-2 rounded-xl border bg-white p-4">
        <h4 className="font-semibold">{exercise.title}</h4><p className="text-xs text-on-surface-variant">{exercise.practiceMode || exercise.exerciseType || 'Chưa có loại thực hành'}{exercise.passThreshold !== undefined ? ` · Ngưỡng đạt: ${exercise.passThreshold}` : ''}</p>
        {exercise.description && <p className="text-sm">{exercise.description}</p>}
        {events.length > 0 && <><p className="text-xs text-on-surface-variant">Minh họa cao độ từ API; trường độ/ngón/kỹ thuật xem trong cấu hình gốc bên dưới.</p>{Array.from({ length: Math.ceil(events.length / 10) }, (_, i) => <div key={i} className="overflow-x-auto"><PracticeStaffPreview events={events.slice(i * 10, i * 10 + 10)} /></div>)}</>}
        {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
        {config ? <details><summary className="cursor-pointer text-sm text-[#1D4532]">Cấu hình thực hành đầy đủ · API</summary><pre className="mt-2 max-h-72 overflow-auto whitespace-pre-wrap break-words rounded-lg bg-[#f4f7f4] p-3 text-xs">{JSON.stringify(config, null, 2)}</pre></details> : !error && <p className="text-sm">Chưa có cấu hình khuông trong API.</p>}
      </article>;
    })}
  </section>;
}
