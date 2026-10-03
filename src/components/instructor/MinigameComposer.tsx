import { useState, type FormEvent } from 'react';
import { AlertCircle, Loader2, Plus, Trash2 } from 'lucide-react';
import type { MinigameInput } from '../../api/lessonContent';
import { SUPPORTED_TIME_SIGNATURES, type TimeSignature } from '../../api/lessonContent';
import PracticeStaffPreview, { type StaffClef } from './PracticeStaffPreview';
import type { PracticeSheetEvent } from './PracticeSheetComposer';

interface Props {
  initial: MinigameInput;
  saving: boolean;
  disabled: boolean;
  onReset: () => void;
  onSubmit: (body: MinigameInput) => void;
}

const panel = 'rounded-2xl border border-[#e4e9e5] bg-white p-4 sm:p-5';
const durations = {
  whole: { label: 'Tròn', beats: 4 }, half: { label: 'Trắng', beats: 2 },
  quarter: { label: 'Đen', beats: 1 }, eighth: { label: 'Móc đơn', beats: 0.5 },
  sixteenth: { label: 'Móc kép', beats: 0.25 },
} as const;
type NoteDuration = PracticeSheetEvent['duration'];
type ComposerNote = { pitch: string; duration: NoteDuration };
const validNote = (note: string) => /^(?:[A-G][#b]?[1-6]|(?:Đô|Rê|Mi|Fa|Sol|La|Si)[1-4])$/.test(note.trim());

export default function MinigameComposer({ initial, saving, disabled, onReset, onSubmit }: Props) {
  const [form, setForm] = useState(initial);
  const [notes, setNotes] = useState<ComposerNote[]>(['Sol1', 'La1', 'Đô2', 'Rê2'].map(pitch => ({ pitch, duration: 'quarter' })));
  const [clef, setClef] = useState<StaffClef>('treble');
  const [timeSignature, setTimeSignature] = useState<TimeSignature>([4, 4]);
  const [tempo, setTempo] = useState(100);
  const [missingIndex, setMissingIndex] = useState(2);
  const [error, setError] = useState('');
  const previewEvents: PracticeSheetEvent[] = notes.map(note => ({ notes: validNote(note.pitch) ? [note.pitch.trim()] : [], duration: note.duration, fingering: [], technique: 'none' }));
  const annotations = notes.map((note, index) => !validNote(note.pitch) ? `Nốt ${index + 1}: chưa hợp lệ` : form.challengeType === 'MELODY_COMPLETE'
    ? `${note.pitch}${index === missingIndex ? ' · Nốt khuyết' : ''}`
    : index < Math.ceil(notes.length / 2) ? 'Nghe mẫu' : 'Chơi theo');
  const totalBeats = notes.reduce((sum, note) => sum + durations[note.duration].beats, 0);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (saving || disabled) return;
    if (!form.title.trim()) { setError('Vui lòng nhập tiêu đề thử thách.'); return; }
    if (![form.maxScore, form.orderIndex, tempo].every(value => Number.isInteger(value) && value > 0) || tempo < 40 || tempo > 240) {
      setError('Điểm và thứ tự phải là số nguyên dương. Tốc độ cần từ 40 đến 240 nhịp/phút.'); return;
    }
    if (notes.length < 2 || notes.some(note => !validNote(note.pitch))) {
      setError('Nhập ít nhất hai nốt có cao độ, ví dụ Sol1, Đô2 hoặc A4.'); return;
    }
    setError('');
    const melody = notes.map(note => note.pitch.trim());
    const beatMs = 60000 / tempo;
    let elapsedMs = 0;
    const events = notes.map((note, index) => {
      const durationBeats = durations[note.duration].beats;
      const durationMs = Math.round(durationBeats * beatMs);
      const event = { note: note.pitch.trim(), mode: index < Math.ceil(notes.length / 2) ? 'SAMPLE' : 'TARGET', duration_beats: durationBeats, at_ms: elapsedMs, duration_ms: durationMs };
      elapsedMs += durationMs;
      return event;
    });
    const content = form.challengeType === 'RHYTHM_MATCH'
      ? { beats: [], clef, rounds: [{ title: 'Vòng 1', tempo_bpm: tempo, clef, time_signature: timeSignature, beats: [], notes: [], events }] }
      : { melody, missing_index: missingIndex, missing_positions: [missingIndex], note_options: {}, correct_answers: {}, bpm: tempo,
          clef, time_signature: timeSignature, durations_beats: events.map(event => event.duration_beats) };
    onSubmit({ ...form, title: form.title.trim(), contentJson: JSON.stringify(content) });
  };

  return <form onSubmit={submit} className="overflow-hidden rounded-2xl border border-outline-variant/15 bg-[#fbf9f4]">
    <div className="border-b border-[#e4e9e5] bg-white px-4 py-4 sm:px-6"><h3 className="font-bold text-[#1D4532]">Thử thách mới</h3><p className="mt-1 text-xs text-on-surface-variant">Đặt tên thử thách, chọn loại trò chơi và biên soạn chuỗi nốt.</p></div>
    <fieldset disabled={saving || disabled} className="min-w-0 space-y-5 p-4 sm:p-6">
      {error && <p role="alert" className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"><AlertCircle className="h-5 w-5 shrink-0" />{error}</p>}
      <section className={`${panel} space-y-4`}>
        <h3 className="text-xs font-bold uppercase tracking-[0.18em] text-[#1D4532]">Thông tin cơ bản</h3>
        <label className="block text-sm font-semibold text-on-surface-variant">Tiêu đề thử thách<input required value={form.title} onChange={event => setForm({ ...form, title: event.target.value })} placeholder="Ví dụ: Luyện nhịp với bốn nốt cơ bản" className="input mt-2" /></label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-semibold text-on-surface-variant">Loại Minigame<select value={form.challengeType} onChange={event => setForm({ ...form, challengeType: event.target.value as MinigameInput['challengeType'] })} className="input mt-2"><option value="RHYTHM_MATCH">Khớp nhịp</option><option value="MELODY_COMPLETE">Hoàn thiện giai điệu</option></select></label>
          <label className="text-sm font-semibold text-on-surface-variant">Độ khó<select value={form.difficulty} onChange={event => setForm({ ...form, difficulty: event.target.value })} className="input mt-2"><option value="BEGINNER">Cơ bản</option><option value="INTERMEDIATE">Trung cấp</option><option value="ADVANCED">Nâng cao</option></select></label>
        </div>
      </section>
      <section className={`${panel} space-y-4`}>
        <h3 className="text-xs font-bold uppercase tracking-[0.18em] text-[#1D4532]">Nội dung trò chơi</h3>
        <p className="text-sm text-on-surface-variant">{form.challengeType === 'RHYTHM_MATCH' ? 'Nửa đầu chuỗi nốt là phần nghe mẫu, nửa sau là phần học viên chơi theo. Chọn trường độ cho từng nốt bên dưới.' : 'Nhập giai điệu và chọn một nốt khuyết để học viên hoàn thiện.'}</p>
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="block text-sm font-semibold text-on-surface-variant">Khóa nhạc<select aria-label="Khóa nhạc" value={clef} onChange={event => setClef(event.target.value as StaffClef)} className="input mt-2"><option value="treble">Khóa Sol</option><option value="bass">Khóa Fa</option></select></label>
          <label className="block text-sm font-semibold text-on-surface-variant">Số chỉ nhịp<select aria-label="Số chỉ nhịp" value={timeSignature.join('/')} onChange={event => setTimeSignature(event.target.value.split('/').map(Number) as TimeSignature)} className="input mt-2">{SUPPORTED_TIME_SIGNATURES.map(signature => <option key={signature.join('/')} value={signature.join('/')}>{signature.join('/')}</option>)}</select></label>
          <label className="block text-sm font-semibold text-on-surface-variant">Tốc độ (nốt đen/phút)<input aria-label="Tốc độ" type="number" min={40} max={240} required value={tempo} onChange={event => setTempo(Number(event.target.value))} className="input mt-2" /></label>
        </div>
        <section aria-label="Xem trước khuông nhạc" className="min-w-0 rounded-xl border border-[#eadfc2] bg-[#fffef9] p-3 sm:p-4">
          <div className="flex flex-wrap items-center justify-between gap-2"><h4 className="text-sm font-bold text-[#1D4532]">Khuông nhạc mẫu</h4><span className="text-xs text-on-surface-variant">{notes.length} nốt · {totalBeats} phách nốt đen</span></div>
          <div className="overflow-x-auto py-2" tabIndex={0} aria-label="Khuông nhạc có thể cuộn ngang">
            <div className="min-w-[480px]">
            <PracticeStaffPreview events={previewEvents} clef={clef} timeSignature={{ numerator: timeSignature[0], denominator: timeSignature[1] }} annotations={annotations} />
            </div>
          </div>
          <p className="text-xs text-on-surface-variant">{form.challengeType === 'MELODY_COMPLETE' ? 'Bản mẫu dành cho giảng viên hiển thị đầy đủ nốt; nốt khuyết được ghi chú bên dưới.' : 'Khuông nhạc cập nhật theo cao độ, khóa nhạc và trường độ bạn chọn.'}</p>
        </section>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {notes.map((note, index) => <div key={index} className="rounded-xl border border-[#d8eadf] bg-[#f7fbf8] p-3">
            <label className="block text-xs font-semibold text-[#1D4532]">Nốt {index + 1}<input aria-label={`Nốt ${index + 1}`} required value={note.pitch} onChange={event => setNotes(current => current.map((value, i) => i === index ? { ...value, pitch: event.target.value } : value))} className="input mt-2" /></label>
            <label className="mt-3 block text-xs font-semibold text-[#1D4532]">Trường độ<select aria-label={`Trường độ nốt ${index + 1}`} value={note.duration} onChange={event => setNotes(current => current.map((value, i) => i === index ? { ...value, duration: event.target.value as NoteDuration } : value))} className="input mt-2">{Object.entries(durations).map(([value, duration]) => <option key={value} value={value}>{duration.label} · {duration.beats}</option>)}</select></label>
            <div className="mt-2 flex items-center justify-between gap-2">
              {form.challengeType === 'MELODY_COMPLETE' ? <label className="flex items-center gap-1.5 text-xs"><input type="radio" name="missing-note" checked={missingIndex === index} onChange={() => setMissingIndex(index)} />Nốt khuyết {index + 1}</label> : <span className="text-xs text-[#567364]">{index < Math.ceil(notes.length / 2) ? 'Nghe mẫu' : 'Chơi theo'}</span>}
              <button type="button" aria-label={`Xóa nốt ${index + 1}`} disabled={notes.length <= 2} onClick={() => { setNotes(current => current.filter((_, i) => i !== index)); setMissingIndex(current => current === index ? 0 : current > index ? current - 1 : current); }} className="rounded p-1 text-red-700 hover:bg-red-50 disabled:opacity-30"><Trash2 className="h-4 w-4" /></button>
            </div>
          </div>)}
        </div>
        <div className="flex flex-wrap items-center gap-3"><button type="button" onClick={() => setNotes(current => [...current, { pitch: 'Đô2', duration: 'quarter' }])} className="flex items-center gap-2 rounded-lg border border-[#c9ddcf] px-3 py-2 text-sm font-semibold text-[#1D4532] hover:bg-[#edf7f2]"><Plus className="h-4 w-4" />Thêm nốt</button><span className="text-xs text-on-surface-variant">Tên nốt kèm cao độ, ví dụ Sol1, Đô2 hoặc A4. Trường độ tính theo nốt đen.</span></div>
      </section>
      <section className={`${panel} grid gap-4 sm:grid-cols-3`}>
        <label className="text-sm font-semibold text-on-surface-variant">Điểm tối đa<input type="number" min={1} required value={form.maxScore} onChange={event => setForm({ ...form, maxScore: Number(event.target.value) })} className="input mt-2" /></label>
        <label className="text-sm font-semibold text-on-surface-variant">Thứ tự<input type="number" min={1} required value={form.orderIndex} onChange={event => setForm({ ...form, orderIndex: Number(event.target.value) })} className="input mt-2" /></label>
        <label className="text-sm font-semibold text-on-surface-variant">Trạng thái phát hành<select value={form.status} onChange={event => setForm({ ...form, status: event.target.value as MinigameInput['status'] })} className="input mt-2"><option value="ACTIVE">Đang phát hành</option><option value="INACTIVE">Tạm ẩn</option><option value="ARCHIVED">Lưu trữ</option></select></label>
      </section>
    </fieldset>
    <div className="grid grid-cols-2 gap-3 border-t border-[#e4e9e5] bg-white px-4 py-4 sm:px-6">
      <button type="button" disabled={saving || disabled} onClick={onReset} className="rounded-xl border border-outline-variant/40 px-4 py-3.5 font-bold text-on-surface-variant hover:bg-[#f0eee9] disabled:opacity-50">Làm mới</button>
      <button type="submit" disabled={saving || disabled} className="flex items-center justify-center gap-2 rounded-xl bg-[#1D4532] px-4 py-3.5 font-bold text-white hover:bg-[#1D4532]/90 disabled:opacity-50">{saving && <Loader2 className="h-4 w-4 animate-spin" />}{saving ? 'Đang lưu…' : 'Tạo Minigame'}</button>
    </div>
  </form>;
}
