import { Music4, Plus, Trash2 } from 'lucide-react';

export type PracticeTechnique = 'none' | 'rung' | 'nhan' | 've' | 'a';

export interface PracticeSheetEvent {
  notes: string[];
  duration: 'quarter' | 'half';
  fingering: string[];
  technique: PracticeTechnique;
}

export interface PracticeSheetLine {
  order: number;
  events: PracticeSheetEvent[];
}

export interface PracticeSheetConfig {
  version: 1;
  staffLines: PracticeSheetLine[];
}

export const EMPTY_PRACTICE_SHEET: PracticeSheetConfig = { version: 1, staffLines: [] };

const NOTES = ['Do1', 'Re1', 'Mi1', 'Fa1', 'Sol1', 'La1', 'Si1', 'Do2', 'Re2', 'Mi2', 'Fa2', 'Sol2', 'La2', 'Si2', 'Do3', 'Re3', 'Mi3', 'Fa3', 'Sol3', 'La3'];
const TECHNIQUE_LABELS: Record<PracticeTechnique, string> = {
  none: 'Không có', rung: 'Rung', nhan: 'Nhấn', ve: 'Vê', a: 'Á',
};

const newEvent = (): PracticeSheetEvent => ({ notes: ['Mi2'], duration: 'quarter', fingering: ['2'], technique: 'none' });

const notePosition = (note: string) => {
  const index = Math.max(0, NOTES.indexOf(note));
  return 83 - Math.min(68, index * 3.6);
};

interface Props {
  value: PracticeSheetConfig;
  onChange: (value: PracticeSheetConfig) => void;
}

/** Soạn dữ liệu khuông nhạc, dùng chung JSON với renderer Godot. */
const PracticeSheetComposer = ({ value, onChange }: Props) => {
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
    if (chord) {
      event.notes = ['Do2', 'Mi2'];
      event.fingering = ['2', '1'];
    }
    changeLine(lineIndex, { ...line, events: [...line.events, event] });
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
          <p className="mt-1 text-xs text-on-surface-variant">Thêm dòng khuông trước, rồi thêm tối đa 10 nốt hoặc hợp âm cho mỗi dòng. Bản xem trước cập nhật ngay.</p>
        </div>
        <button type="button" onClick={addLine} className="inline-flex items-center gap-1.5 rounded-lg bg-[#1D4532] px-3 py-2 text-xs font-bold text-white hover:bg-[#163827]">
          <Plus className="h-4 w-4" /> Thêm dòng khuông
        </button>
      </div>

      {value.staffLines.length === 0 && <p className="rounded-xl border border-dashed border-[#d8b45a]/60 bg-white px-4 py-5 text-center text-sm text-on-surface-variant">Chưa có dòng khuông. Bấm “Thêm dòng khuông” để bắt đầu biên soạn.</p>}

      {value.staffLines.map((line, lineIndex) => (
        <div key={line.order} className="rounded-xl border border-[#e9d9a8] bg-white p-3 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-bold uppercase tracking-wide text-[#1D4532]">Dòng khuông {lineIndex + 1} · {line.events.length}/10 sự kiện</p>
            <button type="button" onClick={() => onChange({ ...value, staffLines: value.staffLines.filter((_, index) => index !== lineIndex).map((item, index) => ({ ...item, order: index + 1 })) })} className="rounded-md p-1.5 text-red-700 hover:bg-red-50" title="Xóa dòng khuông"><Trash2 className="h-4 w-4" /></button>
          </div>

          <div className="overflow-x-auto rounded-lg border border-[#eadfc2] bg-[#fffef9] p-2 min-w-0">
            <div className="relative h-28 min-w-[620px]">
              {[22, 37, 52, 67, 82].map((top) => <span key={top} className="absolute left-1 right-1 border-t border-[#514b40]" style={{ top }} />)}
              <span className="absolute left-4 top-[35px] text-4xl leading-none text-[#302d29]" aria-hidden>𝄞</span>
              {line.events.map((event, eventIndex) => {
                const left = 100 + eventIndex * 56;
                return <div key={eventIndex} className="absolute text-center" style={{ left, top: 0, width: 52 }} title={`${event.notes.join(' + ')} · ${TECHNIQUE_LABELS[event.technique]}`}>
                  {event.technique !== 'none' && <span className="absolute -top-1 left-0 right-0 text-[11px] font-bold text-[#1D4532]">{event.technique === 'nhan' ? '*' : TECHNIQUE_LABELS[event.technique]}</span>}
                  {event.notes.map((note, noteIndex) => <span key={noteIndex} className="absolute left-[20px] h-3.5 w-5 -translate-y-1/2 rounded-full bg-[#151515]" style={{ top: notePosition(note) + noteIndex * 2 }} />)}
                  <span className="absolute left-[29px] h-11 border-l-2 border-[#151515]" style={{ top: Math.min(...event.notes.map(notePosition)) - 40 }} />
                  <span className="absolute top-[92px] left-0 right-0 text-xs font-bold text-[#1D4532]">{event.fingering.join('/')}</span>
                </div>;
              })}
              {line.events.length === 0 && <span className="absolute left-28 top-12 text-xs text-on-surface-variant">Nốt được thêm sẽ hiển thị ở đây.</span>}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button type="button" disabled={line.events.length >= 10} onClick={() => addEvent(lineIndex)} className="inline-flex items-center gap-1 rounded-lg border border-[#1D4532]/30 px-2.5 py-1.5 text-xs font-bold text-[#1D4532] hover:bg-[#edf7f2] disabled:opacity-45"><Plus className="h-3.5 w-3.5" /> Nốt đơn</button>
            <button type="button" disabled={line.events.length >= 10} onClick={() => addEvent(lineIndex, true)} className="inline-flex items-center gap-1 rounded-lg border border-[#1D4532]/30 px-2.5 py-1.5 text-xs font-bold text-[#1D4532] hover:bg-[#edf7f2] disabled:opacity-45"><Plus className="h-3.5 w-3.5" /> Hợp âm / Song thanh</button>
          </div>

          {line.events.map((event, eventIndex) => (
            <div key={eventIndex} className="grid grid-cols-1 gap-2 rounded-lg bg-[#f8f5eb] p-2.5 sm:grid-cols-[auto_1fr_1fr_1fr_1fr_auto] sm:items-end">
              <span className="text-xs font-bold text-[#1D4532]">#{eventIndex + 1}</span>
              <label className="text-[11px] font-semibold text-on-surface-variant">Nốt chính<select value={event.notes[0]} onChange={(e) => updateEvent(lineIndex, eventIndex, { ...event, notes: [e.target.value, ...event.notes.slice(1)] })} className="mt-1 block w-full rounded-md border border-[#d8d2c3] bg-white p-1.5 text-xs">{NOTES.map((note) => <option key={note}>{note}</option>)}</select></label>
              {event.notes.length > 1 ? <label className="text-[11px] font-semibold text-on-surface-variant">Nốt thứ hai<select value={event.notes[1]} onChange={(e) => updateEvent(lineIndex, eventIndex, { ...event, notes: [event.notes[0], e.target.value] })} className="mt-1 block w-full rounded-md border border-[#d8d2c3] bg-white p-1.5 text-xs">{NOTES.map((note) => <option key={note}>{note}</option>)}</select></label> : <span />}
              <label className="text-[11px] font-semibold text-on-surface-variant">Ngón<input value={event.fingering.join('/')} onChange={(e) => updateEvent(lineIndex, eventIndex, { ...event, fingering: e.target.value.split('/').map((item) => item.trim()).filter(Boolean) })} className="mt-1 block w-full rounded-md border border-[#d8d2c3] bg-white p-1.5 text-xs" /></label>
              <label className="text-[11px] font-semibold text-on-surface-variant">Kỹ thuật<select value={event.technique} onChange={(e) => updateEvent(lineIndex, eventIndex, { ...event, technique: e.target.value as PracticeTechnique })} className="mt-1 block w-full rounded-md border border-[#d8d2c3] bg-white p-1.5 text-xs">{Object.entries(TECHNIQUE_LABELS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
              <button type="button" onClick={() => changeLine(lineIndex, { ...line, events: line.events.filter((_, index) => index !== eventIndex) })} className="rounded-md p-2 text-red-700 hover:bg-red-50" title="Xóa nốt"><Trash2 className="h-4 w-4" /></button>
            </div>
          ))}
        </div>
      ))}
    </section>
  );
};

export default PracticeSheetComposer;
