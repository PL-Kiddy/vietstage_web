import { useState } from 'react';
import { ChevronDown, ChevronUp, Music4, Plus, Trash2 } from 'lucide-react';
import PracticeStaffPreview from './PracticeStaffPreview';

export type PracticeTechnique = 'none' | 'rung' | 'nhan' | 've' | 'a';

export interface PracticeSheetEvent {
  kind?: 'single' | 'double' | 'chord';
  chordPreset?: 'C' | 'Am' | 'custom';
  chordName?: string;
  glissandoDirection?: 'up' | 'down' | 'round';
  notes: string[];
  duration: 'whole' | 'half' | 'quarter' | 'eighth' | 'sixteenth';
  fingering: string[];
  technique: PracticeTechnique;
}

export interface PracticeSheetLine {
  order: number;
  events: PracticeSheetEvent[];
}

export interface PracticeSheetConfig {
  version: 1;
  timeSignature?: { numerator: number; denominator: number };
  staffLines: PracticeSheetLine[];
}

export const EMPTY_PRACTICE_SHEET: PracticeSheetConfig = { version: 1, staffLines: [] };

const NOTES = [1, 2, 3, 4].flatMap(octave => ['Do', 'Re', 'Mi', 'Fa', 'Sol', 'La', 'Si'].map(note => `${note}${octave}`));
const TECHNIQUE_LABELS: Record<PracticeTechnique, string> = {
  none: 'Không có', rung: 'Rung', nhan: 'Nhấn', ve: 'Vê', a: 'Á',
};

const newEvent = (): PracticeSheetEvent => ({ notes: ['Mi2'], duration: 'quarter', fingering: ['2'], technique: 'none' });

const FINGER_NAMES: Record<string, string> = { '1': 'Cái', '2': 'Trỏ', '3': 'Giữa', '4': 'Áp út', '5': 'Út' };
function fingeringOptions(event: PracticeSheetEvent): Array<{ value: string; label: string }> {
  if (event.notes.length === 1) {
    const singles = ['1', '2', '3'].map(value => ({ value, label: `Ngón ${value} — ${FINGER_NAMES[value]}` }));
    return event.technique === 've' ? [...singles, { value: '2/1', label: 'Cái + trỏ — gảy luân phiên (1, 2)' }] : singles;
  }
  if (event.notes.length === 2) return [
    { value: '2/1', label: 'Trỏ + cái — nốt cao: 2, nốt thấp: 1' },
    { value: '3/1', label: 'Giữa + cái — nốt cao: 3, nốt thấp: 1' },
    { value: '3/2', label: 'Giữa + trỏ — nốt cao: 3, nốt thấp: 2' },
  ];
  if (event.notes.length === 3) return [{ value: '3/2/1', label: 'Cái + trỏ + giữa — thấp → cao: 1–2–3' }];
  return [];
}

interface Props {
  instrument?: 'dan_tranh' | 'sao_truc';
  value: PracticeSheetConfig;
  onChange: (value: PracticeSheetConfig) => void;
}

/** Local authoring draft; API persistence and Godot mapping are integrated separately. */
const PracticeSheetComposer = ({ value, onChange, instrument = 'dan_tranh' }: Props) => {
  const [activeEvent, setActiveEvent] = useState<string | null>(null);
  const isFlute = instrument === 'sao_truc';
  const noteOptions = isFlute ? ['Đô', 'Rê', 'Mi', 'Fa', 'Sol', 'La', 'Sib', 'Si', 'Đô2', 'Rê2', 'Mi2', 'Fa2', 'Sol2', 'La2', 'Sib2', 'Si2', 'REST'] : NOTES;
  const changeLine = (lineIndex: number, next: PracticeSheetLine) => {
    onChange({ ...value, staffLines: value.staffLines.map((line, index) => index === lineIndex ? next : line) });
  };

  const addLine = () => onChange({
    ...value,
    staffLines: [...value.staffLines, { order: value.staffLines.length + 1, events: [] }],
  });

  const addEvent = (lineIndex: number, kind: 'single' | 'double' | 'chord' = 'single') => {
    const line = value.staffLines[lineIndex];
    if (line.events.length >= 10) return;
    const event = newEvent();
    event.kind = kind;
    if (isFlute) { event.notes = ['Đô']; event.fingering = []; }
    if (kind === 'double') {
      event.notes = ['Do2', 'Mi2'];
      event.fingering = ['2', '1'];
    }
    if (kind === 'chord') {
      event.notes = ['Do2', 'Mi2', 'Sol2'];
      event.fingering = [];
      event.chordPreset = 'C';
    }
    changeLine(lineIndex, { ...line, events: [...line.events, event] });
    setActiveEvent(`${lineIndex}:${line.events.length}`);
  };

  const updateEvent = (lineIndex: number, eventIndex: number, next: PracticeSheetEvent) => {
    const line = value.staffLines[lineIndex];
    changeLine(lineIndex, { ...line, events: line.events.map((event, index) => index === eventIndex ? next : event) });
  };

  return (
    <section className="rounded-2xl border border-[#d8b45a]/45 bg-[#fffdf6] p-4 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h5 className="flex items-center gap-2 text-sm font-bold text-[#1D4532]"><Music4 className="h-4 w-4" /> Khuông nhạc thực hành</h5>
          <p className="mt-1 text-xs text-on-surface-variant">{isFlute ? 'Sáo trúc: tối đa 10 nốt hoặc dấu lặng mỗi dòng. Chọn trường độ để luyện giữ hơi, chuyển nốt và lấy hơi.' : 'Thêm dòng khuông trước, rồi thêm tối đa 10 nốt hoặc hợp âm cho mỗi dòng. Bản xem trước cập nhật ngay.'}</p>
        </div>
        <button type="button" onClick={addLine} className="inline-flex items-center gap-1.5 rounded-lg bg-[#1D4532] px-3 py-2 text-xs font-bold text-white hover:bg-[#163827]">
          <Plus className="h-4 w-4" /> Thêm dòng khuông
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-lg bg-white border border-[#e4e9e5] px-3 py-2">
        <label className="flex items-center gap-2 text-xs font-semibold text-[#1D4532]">Số chỉ nhịp
          <select aria-label="Số chỉ nhịp" value={value.timeSignature ? `${value.timeSignature.numerator}/${value.timeSignature.denominator}` : ''} onChange={e => {
            const [numerator, denominator] = e.target.value.split('/').map(Number);
            onChange({ ...value, timeSignature: e.target.value ? { numerator, denominator } : undefined });
          }} className="rounded-md border border-[#d8d2c3] bg-white px-2 py-1.5 text-sm">
            <option value="">Chưa thêm</option>
            {['2/4', '3/4', '4/4', '3/8', '6/8', '9/8', '12/8', ...(value.timeSignature && !['2/4', '3/4', '4/4', '3/8', '6/8', '9/8', '12/8'].includes(`${value.timeSignature.numerator}/${value.timeSignature.denominator}`) ? [`${value.timeSignature.numerator}/${value.timeSignature.denominator}`] : [])].map(meter => <option key={meter}>{meter}</option>)}
          </select>
        </label>
        <span className="text-xs text-on-surface-variant">Chọn nhịp để thêm vào khuông; chọn “Chưa thêm” để bỏ.</span>
      </div>

      {value.staffLines.length === 0 && <p className="rounded-xl border border-dashed border-[#d8b45a]/60 bg-white px-4 py-5 text-center text-sm text-on-surface-variant">Chưa có dòng khuông. Bấm “Thêm dòng khuông” để bắt đầu biên soạn.</p>}

      {value.staffLines.map((line, lineIndex) => (
        <div key={line.order} className="rounded-xl border border-[#e9d9a8] bg-white p-3 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-bold uppercase tracking-wide text-[#1D4532]">Dòng khuông {lineIndex + 1} · {line.events.length}/10 vị trí</p>
            <button type="button" onClick={() => { setActiveEvent(null); onChange({ ...value, staffLines: value.staffLines.filter((_, index) => index !== lineIndex).map((item, index) => ({ ...item, order: index + 1 })) }); }} className="rounded-md p-1.5 text-red-700 hover:bg-red-50" title="Xóa dòng khuông"><Trash2 className="h-4 w-4" /></button>
          </div>

          <div className="overflow-x-auto rounded-lg border border-[#eadfc2] bg-[#fffef9] p-2 min-w-0">
            <PracticeStaffPreview events={line.events} instrument={instrument} timeSignature={value.timeSignature} />
          </div>

          <div className="flex flex-wrap gap-2">
            <button type="button" disabled={line.events.length >= 10} onClick={() => addEvent(lineIndex)} className="inline-flex items-center gap-1 rounded-lg border border-[#1D4532]/30 px-2.5 py-1.5 text-xs font-bold text-[#1D4532] hover:bg-[#edf7f2] disabled:opacity-45"><Plus className="h-3.5 w-3.5" /> Nốt đơn</button>
            {!isFlute && <button type="button" disabled={line.events.length >= 10} onClick={() => addEvent(lineIndex, 'double')} className="inline-flex items-center gap-1 rounded-lg border border-[#1D4532]/30 px-2.5 py-1.5 text-xs font-bold text-[#1D4532] hover:bg-[#edf7f2] disabled:opacity-45"><Plus className="h-3.5 w-3.5" /> Song thanh</button>}
            {!isFlute && <button type="button" disabled={line.events.length >= 10} onClick={() => addEvent(lineIndex, 'chord')} className="inline-flex items-center gap-1 rounded-lg border border-[#1D4532]/30 px-2.5 py-1.5 text-xs font-bold text-[#1D4532] hover:bg-[#edf7f2] disabled:opacity-45"><Plus className="h-3.5 w-3.5" /> Hợp âm</button>}
          </div>

          {line.events.map((event, eventIndex) => (
            <div key={eventIndex} className="overflow-hidden rounded-lg border border-[#e4e9e5] bg-white">
              <div className="flex items-center gap-2 px-3 py-2">
                <button type="button" aria-expanded={activeEvent === `${lineIndex}:${eventIndex}`} onClick={() => setActiveEvent(activeEvent === `${lineIndex}:${eventIndex}` ? null : `${lineIndex}:${eventIndex}`)} className="flex min-w-0 flex-1 items-center gap-3 text-left py-1">
                  <span className="text-xs font-bold text-[#1D4532]">#{eventIndex + 1}</span>
                  <span className="min-w-0 flex-1 text-sm font-semibold text-[#1D4532]">{event.kind === 'chord' ? `${event.chordPreset === 'C' ? 'Đô trưởng' : event.chordPreset === 'Am' ? 'La thứ' : event.chordName || 'Hợp âm khác'} · ` : event.notes.length === 2 ? 'Song thanh · ' : ''}{event.notes.map(note => note === 'REST' ? 'Dấu lặng' : note.replace('Sib', 'Si♭')).join(' + ')}<span className="ml-2 text-xs font-normal text-on-surface-variant">· {({ whole: 'Tròn', half: 'Trắng', quarter: 'Đen', eighth: 'Móc đơn', sixteenth: 'Móc kép' })[event.duration]}{event.technique !== 'none' ? ` · ${TECHNIQUE_LABELS[event.technique]}` : ''}</span></span>
                  {activeEvent === `${lineIndex}:${eventIndex}` ? <ChevronUp className="h-4 w-4 shrink-0" /> : <ChevronDown className="h-4 w-4 shrink-0" />}
                </button>
                <button type="button" onClick={() => { setActiveEvent(null); changeLine(lineIndex, { ...line, events: line.events.filter((_, index) => index !== eventIndex) }); }} className="shrink-0 rounded-md p-2 text-red-700 hover:bg-red-50" aria-label={`Xóa nốt ${eventIndex + 1}`}><Trash2 className="h-4 w-4" /></button>
              </div>
              {activeEvent === `${lineIndex}:${eventIndex}` && <div className="grid grid-cols-1 gap-3 border-t border-[#e4e9e5] bg-[#f8faf8] p-3 sm:grid-cols-2">
              {event.kind === 'chord' && <label className="text-[11px] font-semibold text-on-surface-variant sm:col-span-2">Hợp âm
                <select value={event.chordPreset || 'custom'} onChange={e => {
                  const preset = e.target.value as PracticeSheetEvent['chordPreset'];
                  updateEvent(lineIndex, eventIndex, { ...event, chordPreset: preset, fingering: [], notes: preset === 'C' ? ['Do2', 'Mi2', 'Sol2'] : preset === 'Am' ? ['La1', 'Do2', 'Mi2'] : event.notes });
                }} className="mt-1 block w-full rounded-md border border-[#d8d2c3] bg-white p-1.5 text-xs">
                  <option value="C">Đô trưởng (C) · Đô – Mi – Sol</option>
                  <option value="Am">La thứ (Am) · La – Đô – Mi</option>
                  <option value="custom">Thêm hợp âm khác…</option>
                </select>
              </label>}
              {event.kind === 'chord' && event.chordPreset === 'custom' && <label className="text-[11px] font-semibold text-on-surface-variant sm:col-span-2">Tên hợp âm<input value={event.chordName || ''} placeholder="Nhập tên hợp âm" onChange={e => updateEvent(lineIndex, eventIndex, { ...event, chordName: e.target.value })} className="mt-1 block w-full rounded-md border border-[#d8d2c3] bg-white p-1.5 text-xs" /></label>}
              {(event.kind !== 'chord' || event.chordPreset === 'custom') && event.notes.map((note, noteIndex) => <label key={noteIndex} className="text-[11px] font-semibold text-on-surface-variant">{event.notes.length === 1 ? 'Nốt nhạc' : `Nốt ${noteIndex + 1}`}
                <div className="mt-1 flex items-center gap-2"><select value={note} onChange={e => updateEvent(lineIndex, eventIndex, { ...event, notes: event.notes.map((n, i) => i === noteIndex ? e.target.value : n) })} className="block min-w-0 w-full rounded-md border border-[#d8d2c3] bg-white p-1.5 text-xs">{noteOptions.map(n => <option key={n} value={n}>{n === 'REST' ? 'Dấu lặng (lấy hơi)' : n.replace('Sib', 'Si♭')}</option>)}</select>
                {event.kind === 'chord' && event.notes.length > 3 && <button type="button" aria-label={`Xóa thành phần ${noteIndex + 1}`} onClick={() => updateEvent(lineIndex, eventIndex, { ...event, notes: event.notes.filter((_, i) => i !== noteIndex), fingering: [] })} className="shrink-0 p-1 text-red-700"><Trash2 className="h-4 w-4" /></button>}</div>
              </label>)}
              {event.kind === 'chord' && event.chordPreset === 'custom' && <button type="button" disabled={event.notes.length >= 6} onClick={() => updateEvent(lineIndex, eventIndex, { ...event, notes: [...event.notes, NOTES.find(n => !event.notes.includes(n)) || 'Do2'], fingering: [] })} className="self-end rounded-md border p-2 text-xs text-[#1D4532] disabled:opacity-45">+ Thêm nốt hợp âm (tối đa 6)</button>}
              {!isFlute && <label className="text-[11px] font-semibold text-on-surface-variant">Ngón gảy · Tay phải
                <select value={event.fingering.join('/')} onChange={e => updateEvent(lineIndex, eventIndex, { ...event, fingering: e.target.value ? e.target.value.split('/') : [] })} className="mt-1 block w-full rounded-md border border-[#d8d2c3] bg-white p-1.5 text-xs">
                  <option value="">Không ghi số ngón</option>
                  {fingeringOptions(event).map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
                  {event.notes.length === 1 && <optgroup label="Mở rộng · Chỉ khi bài yêu cầu"><option value="4">Ngón 4 — Áp út</option><option value="5">Ngón 5 — Út</option></optgroup>}
                  {event.fingering.length > 0 && !fingeringOptions(event).some(option => option.value === event.fingering.join('/')) && !(event.notes.length === 1 && ['4', '5'].includes(event.fingering.join('/'))) && <option value={event.fingering.join('/')}>Đã lưu: {event.fingering.map(finger => FINGER_NAMES[finger] || finger).join(' + ')} — kiểm tra lại cách gảy</option>}
                </select>
                <span className="mt-1 block font-normal">{event.technique === 'nhan' || event.technique === 'rung' ? 'Đây là ngón gảy tay phải, không phải ngón nhấn/rung tay trái.' : event.technique === 've' && event.notes.length === 1 ? 'Vê: chọn một ngón hoặc cái–trỏ gảy luân phiên.' : event.notes.length > 3 ? 'Hợp âm nhiều hơn 3 nốt cần hướng dẫn cách gảy riêng trong lời cô Mai.' : event.notes.length > 1 ? 'Gảy đồng thời; chọn theo nốt cao/thấp, không theo thứ tự nhập nốt.' : 'Chọn ngón dùng để gảy nốt này.'}</span>
              </label>}
              {!isFlute && <label className="text-[11px] font-semibold text-on-surface-variant">Kỹ thuật<select value={event.technique} onChange={(e) => updateEvent(lineIndex, eventIndex, { ...event, technique: e.target.value as PracticeTechnique })} className="mt-1 block w-full rounded-md border border-[#d8d2c3] bg-white p-1.5 text-xs">{Object.entries(TECHNIQUE_LABELS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>}
              {!isFlute && event.technique === 'a' && <label className="text-[11px] font-semibold text-on-surface-variant">Hướng Á<select value={event.glissandoDirection || 'up'} onChange={e => updateEvent(lineIndex, eventIndex, { ...event, glissandoDirection: e.target.value as PracticeSheetEvent['glissandoDirection'] })} className="mt-1 block w-full rounded-md border border-[#d8d2c3] bg-white p-1.5 text-xs"><option value="up">Á lên</option><option value="down">Á xuống</option><option value="round">Á vòng</option></select></label>}
              <label className="text-[11px] font-semibold text-on-surface-variant">Trường độ<select value={event.duration} onChange={(e) => updateEvent(lineIndex, eventIndex, { ...event, duration: e.target.value as PracticeSheetEvent['duration'] })} className="mt-1 block w-full rounded-md border border-[#d8d2c3] bg-white p-1.5 text-xs">{Object.entries({ whole: 'Tròn', half: 'Trắng', quarter: 'Đen', eighth: 'Móc đơn', sixteenth: 'Móc kép' }).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
              </div>}
            </div>
          ))}
        </div>
      ))}
    </section>
  );
};

export default PracticeSheetComposer;
