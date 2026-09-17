import { useEffect, useState } from 'react';
import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react';
import { lessonContentsApi } from '../../api/services';
import { lessonDetailApi } from '../../api/management';
import type { Lesson } from '../../api/types';
import ApiPracticePreview from './ApiPracticePreview';
import PracticeSheetComposer, { type PracticeSheetConfig } from './PracticeSheetComposer';
import PracticeStaffPreview from './PracticeStaffPreview';
import { teacherSpeechToRequest } from '../../api/danTranhCourseContract';

type Section = { key: string; id?: number; content_text: string };
export default function LessonBodyEditor({ lesson, readOnly, initialSheet, onSaveSheet, onClose }: {
  lesson: { id: string; title: string; instrument: string };
  readOnly: boolean; initialSheet: PracticeSheetConfig;
  onSaveSheet: (sheet: PracticeSheetConfig) => void; onClose: () => void;
}) {
  const [sections, setSections] = useState<Section[]>([]);
  const [removedIds, setRemovedIds] = useState<number[]>([]);
  const [sheet, setSheet] = useState(initialSheet);
  const instrumentName = lesson.instrument.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const supported = /tranh|sao|flute/.test(instrumentName);
  const instrument = /sao|flute/.test(instrumentName) ? 'sao_truc' : 'dan_tranh';
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [saveError, setSaveError] = useState('');
  const [success, setSuccess] = useState('');
  const [dirty, setDirty] = useState(false);
  const [retry, setRetry] = useState(0);
  const [apiExercises, setApiExercises] = useState<NonNullable<Lesson['exercises']>>([]);
  const [otherContents, setOtherContents] = useState<NonNullable<Lesson['contents']>>([]);
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError('');
    lessonDetailApi.get(Number(lesson.id)).then(async detail => {
      if (cancelled) return;
      setApiExercises(detail.exercises ?? []);
      const isSpeech = (item: NonNullable<Lesson['contents']>[number]) => !item.contentType || ['TEACHER_SPEECH', 'THEORY_TEXT', 'TEXT', 'PRACTICE_INSTRUCTION'].includes(item.contentType);
      setOtherContents((detail.contents ?? []).filter(item => !isSpeech(item)));
      const items = detail.contents !== undefined
        ? detail.contents.filter(isSpeech).map(item => ({ id: item.id, content_text: item.contentText ?? '', order_index: item.orderIndex }))
        : await lessonContentsApi.list(Number(lesson.id));
      if (!cancelled) setSections([...items].sort((a, b) => a.order_index - b.order_index).map(item => ({ ...item, key: String(item.id) })));
    }).catch(error => { if (!cancelled) setLoadError(error instanceof Error ? error.message : 'Không thể tải nội dung.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [lesson.id, retry]);
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);
  const changed = () => { setDirty(true); setSuccess(''); setSaveError(''); };
  const close = () => { if (!saving && (!dirty || window.confirm('Bỏ các thay đổi chưa lưu?'))) onClose(); };
  const move = (index: number, direction: number) => {
    const next = [...sections];
    [next[index], next[index + direction]] = [next[index + direction], next[index]];
    setSections(next); changed();
  };
  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (readOnly || loading || saving || loadError) return;
    if (otherContents.length) { setSaveError('Bài học này hiện chỉ hỗ trợ xem nội dung.'); return; }
    if (sections.some(section => !section.content_text.trim())) { setSaveError('Nhập nội dung hoặc xóa đoạn đang để trống.'); return; }
    setSaving(true); setSaveError(''); setSuccess('');
    try {
      for (let index = 0; index < sections.length; index++) {
        const section = sections[index];
        const body = teacherSpeechToRequest(section.content_text, index + 1);
        const saved = section.id !== undefined
          ? await lessonContentsApi.update(Number(lesson.id), section.id, body)
          : await lessonContentsApi.create(Number(lesson.id), body);
        // Keep assigned IDs so a retry cannot create the same paragraph twice.
        setSections(current => current.map(item => item.key === section.key ? { ...item, id: saved.id } : item));
      }
      for (const id of removedIds) {
        await lessonContentsApi.remove(Number(lesson.id), id);
        setRemovedIds(current => current.filter(item => item !== id));
      }
      onSaveSheet(sheet);
      setDirty(false);
      setSuccess('Đã lưu nội dung hướng dẫn bài học.');
    } catch (error) { setSaveError(error instanceof Error ? error.message : 'Chưa lưu xong. Vui lòng thử lại.'); }
    finally { setSaving(false); }
  };
  return <div className="fixed inset-0 z-50 flex justify-end bg-black/50" role="presentation" onClick={close}>
    <section role="dialog" aria-modal="true" aria-label={readOnly ? 'Xem bài học' : 'Chỉnh sửa bài học'} className="flex h-full w-full flex-col bg-[#fbf9f4] shadow-2xl sm:w-4/5 lg:w-1/2" onClick={event => event.stopPropagation()} onKeyDown={event => { if (event.key === 'Escape') { event.stopPropagation(); close(); } }}>
      <header className="flex items-start justify-between gap-3 border-b bg-[#EDF7F2] p-6"><div><h2 className="text-xl font-bold text-[#1D4532]">{readOnly ? 'Xem bài học' : 'Chỉnh sửa bài học'}</h2><p className="mt-1 text-sm">{lesson.title} · {lesson.instrument}</p></div><button autoFocus type="button" disabled={saving} aria-label="Đóng" onClick={close} className="rounded-lg px-3 py-1 text-xl hover:bg-white">×</button></header>
      <form onSubmit={save} className="flex min-h-0 flex-1 flex-col">
        <div className="flex-1 space-y-5 overflow-y-auto p-6">
          {loading && <p role="status">Đang tải bài học…</p>}
          {loadError && <p role="alert" className="rounded-lg bg-red-50 p-3 text-red-700">{loadError} <button type="button" onClick={() => setRetry(value => value + 1)} className="underline">Thử lại</button></p>}
          {!readOnly && otherContents.length > 0 && <p className="text-sm text-amber-800">Bài học này hiện chỉ hỗ trợ xem nội dung.</p>}
          {!loading && !loadError && <fieldset disabled={saving || otherContents.length > 0} className="min-w-0 space-y-5">
            {otherContents.length > 0 && <section className="space-y-3 rounded-2xl border bg-white p-4"><h3 className="font-bold text-[#1D4532]">Hoạt động bài học</h3>{[...otherContents].sort((a,b) => a.orderIndex - b.orderIndex).map(item => <div key={item.id} className="rounded-lg bg-[#f4f7f4] p-3 text-sm"><p className="font-semibold">Bước {item.orderIndex}</p><p className="mt-1 whitespace-pre-wrap">{item.contentText || 'Nội dung này chưa hỗ trợ xem trước.'}</p></div>)}</section>}
            <section className="space-y-3 rounded-2xl border bg-white p-4">
              <h3 className="font-bold text-[#1D4532]">Nội dung hướng dẫn bài học</h3>
              <p className="text-xs text-on-surface-variant">Mỗi đoạn là một lượt cô Mai nói, theo thứ tự từ trên xuống; tiếp theo là phần thực hành.</p>
              {sections.map((section, index) => <div key={section.key} className="rounded-xl border border-[#e4e9e5] p-3">
                <div className="mb-2 flex items-center justify-between gap-2"><span className="text-xs font-semibold">Đoạn {index + 1}</span>{!readOnly && <div className="flex gap-1">
                  <button type="button" disabled={index === 0} onClick={() => move(index, -1)} aria-label={`Đưa đoạn ${index + 1} lên`} className="p-2 disabled:opacity-30"><ArrowUp className="h-4 w-4" /></button>
                  <button type="button" disabled={index === sections.length - 1} onClick={() => move(index, 1)} aria-label={`Đưa đoạn ${index + 1} xuống`} className="p-2 disabled:opacity-30"><ArrowDown className="h-4 w-4" /></button>
                  <button type="button" onClick={() => { if (section.id !== undefined) setRemovedIds(current => [...current, section.id!]); setSections(current => current.filter(item => item.key !== section.key)); changed(); }} aria-label={`Xóa đoạn ${index + 1}`} className="p-2 text-red-700"><Trash2 className="h-4 w-4" /></button>
                </div>}</div>
                {readOnly ? <p className="whitespace-pre-wrap text-sm leading-6">{section.content_text}</p> : <textarea aria-label={`Lời cô Mai đoạn ${index + 1}`} rows={3} value={section.content_text} onChange={event => { setSections(current => current.map(item => item.key === section.key ? { ...item, content_text: event.target.value } : item)); changed(); }} placeholder="Nhập lời cô Mai hướng dẫn…" className="block w-full resize-y rounded-lg border bg-[#fbf9f4] p-3 text-sm" />}
              </div>)}
              {!sections.length && <p className="text-sm text-on-surface-variant">Chưa có nội dung hướng dẫn.</p>}
              {!readOnly && <button type="button" onClick={() => { setSections(current => [...current, { key: crypto.randomUUID(), content_text: '' }]); changed(); }} className="inline-flex items-center gap-2 rounded-lg border border-[#1D4532]/30 px-3 py-2 text-sm font-semibold text-[#1D4532]"><Plus className="h-4 w-4" /> Thêm đoạn hướng dẫn</button>}
            </section>
            {apiExercises.length > 0 ? <ApiPracticePreview exercises={apiExercises} /> : supported ? (
              readOnly ? <section className="space-y-3"><h3 className="font-bold text-[#1D4532]">Khuôn nhạc thực hành</h3>{sheet.staffLines.length ? sheet.staffLines.map((line, index) => <div key={index} className="overflow-x-auto rounded-xl border bg-white p-3"><PracticeStaffPreview events={line.events} instrument={instrument} timeSignature={sheet.timeSignature} /></div>) : <p className="text-sm">Chưa có khuôn nhạc thực hành.</p>}</section>
              : <PracticeSheetComposer value={sheet} onChange={next => { setSheet(next); changed(); }} instrument={instrument} />
            ) : <ApiPracticePreview exercises={apiExercises} />}

          </fieldset>}
          {saveError && <p role="alert" className="text-sm text-red-700">{saveError}</p>}
          {success && <p role="status" className="text-sm text-[#1D4532]">{success}</p>}
        </div>
        <footer className="flex justify-end gap-3 border-t bg-white p-4"><button type="button" disabled={saving} onClick={close} className="rounded-lg border px-5 py-2">Đóng</button>{!readOnly && <button type="submit" disabled={loading || saving || !!loadError || otherContents.length > 0 || !dirty} className="rounded-lg bg-[#1D4532] px-5 py-2 font-semibold text-white disabled:opacity-40">{saving ? 'Đang lưu…' : 'Lưu thay đổi'}</button>}</footer>
      </form>
    </section>
  </div>;
}
