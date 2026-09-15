import { useState } from 'react';
import { ChevronDown, ChevronUp, Music4, Plus, Trash2 } from 'lucide-react';
import PracticeStaffPreview from './PracticeStaffPreview';

export type PracticeTechnique = 'none' | 'rung' | 'nhan' | 've' | 'a';

export interface PracticeSheetEvent {
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

  const addEvent = (lineIndex: number, chord = false) => {
    const line = value.staffLines[lineIndex];
    if (line.events.length >= 10) return;
    const event = newEvent();
    if (isFlute) { event.notes = ['Đô']; event.fingering = []; }
    if (chord) {
      event.notes = ['Do2', 'Mi2'];
      event.fingering = ['2', '1'];
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
            {!isFlute && <button type="button" disabled={line.events.length >= 10} onClick={() => addEvent(lineIndex, true)} className="inline-flex items-center gap-1 rounded-lg border border-[#1D4532]/30 px-2.5 py-1.5 text-xs font-bold text-[#1D4532] hover:bg-[#edf7f2] disabled:opacity-45"><Plus className="h-3.5 w-3.5" /> Hợp âm / Song thanh</button>}
          </div>

          {line.events.map((event, eventIndex) => (
            <div key={eventIndex} className="overflow-hidden rounded-lg border border-[#e4e9e5] bg-white">
              <div className="flex items-center gap-2 px-3 py-2">
                <button type="button" aria-expanded={activeEvent === `${lineIndex}:${eventIndex}`} onClick={() => setActiveEvent(activeEvent === `${lineIndex}:${eventIndex}` ? null : `${lineIndex}:${eventIndex}`)} className="flex min-w-0 flex-1 items-center gap-3 text-left py-1">
                  <span className="text-xs font-bold text-[#1D4532]">#{eventIndex + 1}</span>
                  <span className="min-w-0 flex-1 text-sm font-semibold text-[#1D4532]">{event.notes.map(note => note === 'REST' ? 'Dấu lặng' : note.replace('Sib', 'Si♭')).join(' + ')}<span className="ml-2 text-xs font-normal text-on-surface-variant">· {({ whole: 'Tròn', half: 'Trắng', quarter: 'Đen', eighth: 'Móc đơn', sixteenth: 'Móc kép' })[event.duration]}{event.technique !== 'none' ? ` · ${TECHNIQUE_LABELS[event.technique]}` : ''}</span></span>
                  {activeEvent === `${lineIndex}:${eventIndex}` ? <ChevronUp className="h-4 w-4 shrink-0" /> : <ChevronDown className="h-4 w-4 shrink-0" />}
                </button>
                <button type="button" onClick={() => { setActiveEvent(null); changeLine(lineIndex, { ...line, events: line.events.filter((_, index) => index !== eventIndex) }); }} className="shrink-0 rounded-md p-2 text-red-700 hover:bg-red-50" aria-label={`Xóa nốt ${eventIndex + 1}`}><Trash2 className="h-4 w-4" /></button>
              </div>
              {activeEvent === `${lineIndex}:${eventIndex}` && <div className="grid grid-cols-1 gap-3 border-t border-[#e4e9e5] bg-[#f8faf8] p-3 sm:grid-cols-2">
              <label className="text-[11px] font-semibold text-on-surface-variant">Nốt chính<select value={event.notes[0]} onChange={(e) => updateEvent(lineIndex, eventIndex, { ...event, notes: [e.target.value, ...event.notes.slice(1)] })} className="mt-1 block w-full rounded-md border border-[#d8d2c3] bg-white p-1.5 text-xs">{noteOptions.map((note) => <option key={note} value={note}>{note === 'REST' ? 'Dấu lặng (lấy hơi)' : note.replace('Sib', 'Si♭')}</option>)}</select></label>
              {!isFlute && event.notes.length > 1 ? <label className="text-[11px] font-semibold text-on-surface-variant">Nốt thứ hai<select value={event.notes[1]} onChange={(e) => updateEvent(lineIndex, eventIndex, { ...event, notes: [event.notes[0], e.target.value] })} className="mt-1 block w-full rounded-md border border-[#d8d2c3] bg-white p-1.5 text-xs">{noteOptions.map((note) => <option key={note} value={note}>{note === 'REST' ? 'Dấu lặng (lấy hơi)' : note.replace('Sib', 'Si♭')}</option>)}</select></label> : null}
              {!isFlute && <label className="text-[11px] font-semibold text-on-surface-variant">Ngón<input value={event.fingering.join('/')} onChange={(e) => updateEvent(lineIndex, eventIndex, { ...event, fingering: e.target.value.split('/').map((item) => item.trim()).filter(Boolean) })} className="mt-1 block w-full rounded-md border border-[#d8d2c3] bg-white p-1.5 text-xs" /></label>}
              {!isFlute && <label className="text-[11px] font-semibold text-on-surface-variant">Kỹ thuật<select value={event.technique} onChange={(e) => updateEvent(lineIndex, eventIndex, { ...event, technique: e.target.value as PracticeTechnique })} className="mt-1 block w-full rounded-md border border-[#d8d2c3] bg-white p-1.5 text-xs">{Object.entries(TECHNIQUE_LABELS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>}
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
