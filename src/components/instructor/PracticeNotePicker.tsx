import { useId, useRef, useState } from 'react';
import { Check, ChevronDown, Search } from 'lucide-react';

// String order from VietStageApp/scripts/LessonDanTranh.gd (17-string tuning).
const OPEN_STRINGS = ['Sol1', 'La1', 'Do2', 'Re2', 'Mi2', 'Sol2', 'La2', 'Do3', 'Re3', 'Mi3', 'Sol3', 'La3', 'Do4', 'Re4', 'Mi4', 'Sol4', 'La4'];
const displayName = (note: string) => note === 'REST' ? 'Dấu lặng' : note.replace(/^Do/, 'Đô').replace(/^Re/, 'Rê').replace('Sib', 'Si♭');
const normalize = (text: string) => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/gi, 'd').toLowerCase();
function sourceStringIndex(note: string) {
  const source = note.startsWith('Fa') ? note.replace('Fa', 'Mi') : note.startsWith('Si') ? note.replace('Si', 'La') : '';
  return OPEN_STRINGS.indexOf(source);
}
function stringLabel(note: string) {
  const index = OPEN_STRINGS.indexOf(note);
  if (index >= 0) return `Dây ${index + 1}`;
  const sourceIndex = sourceStringIndex(note);
  return sourceIndex >= 0 ? `Nhấn dây ${sourceIndex + 1}` : 'Nốt cũ';
}
const noteLabel = (note: string, isFlute: boolean) => isFlute ? displayName(note) : `${stringLabel(note)} · ${displayName(note)}`;

export default function PracticeNotePicker({ value, options, isFlute, label, onChange }: {
  value: string; options: string[]; isFlute: boolean; label: string; onChange: (note: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const trigger = useRef<HTMLButtonElement>(null);
  const panelId = useId();
  const groups = isFlute ? [{ title: '', notes: options }] : [
    { title: 'Dây đàn', notes: OPEN_STRINGS.filter(note => options.includes(note)) },
    { title: 'Nốt nhấn', notes: options.filter(note => !OPEN_STRINGS.includes(note) && sourceStringIndex(note) >= 0).sort((a, b) => sourceStringIndex(a) - sourceStringIndex(b)) },
  ];
  const visibleGroups = groups.map(group => ({ ...group, notes: group.notes.filter(note => normalize(noteLabel(note, isFlute)).includes(normalize(query))) })).filter(group => group.notes.length > 0);
  return <div className="min-w-0 flex-1" onBlur={e => { if (!e.currentTarget.contains(e.relatedTarget)) setOpen(false); }} onKeyDown={e => {
    if (e.key === 'Escape') { e.stopPropagation(); setOpen(false); trigger.current?.focus(); }
  }}>
    <button ref={trigger} type="button" aria-label={`${label}: ${displayName(value)}${isFlute ? '' : `, ${stringLabel(value)}`}`} aria-expanded={open} aria-controls={panelId} onClick={() => { setOpen(!open); setQuery(''); }} className="flex w-full items-center gap-2 rounded-lg border border-[#cbd9d0] bg-white px-3 py-2 text-left text-sm text-[#1D4532] hover:border-[#1D4532] focus-visible:outline-2 focus-visible:outline-[#1D4532]">
      <span className="min-w-0 flex-1 truncate font-semibold">{noteLabel(value, isFlute)}</span>
      <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
    </button>
    {open && <div id={panelId} className="mt-1 overflow-hidden rounded-xl border border-[#cbd9d0] bg-white shadow-md">
      <div className="flex items-center gap-2 border-b border-[#e4e9e5] px-3 py-2"><Search className="h-4 w-4 shrink-0 text-[#64776b]" /><input autoFocus aria-label="Tìm nốt hoặc số dây" placeholder={isFlute ? 'Tìm nốt…' : 'Tìm nốt hoặc dây…'} value={query} onChange={e => setQuery(e.target.value)} className="min-w-0 w-full bg-transparent text-xs font-normal outline-none" /></div>
      <div className="max-h-52 overflow-y-auto overscroll-contain p-1" role="group" aria-label={label}>
        {visibleGroups.map(group => <div key={group.title}>
          {group.title && <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-[#64776b]">{group.title}</p>}
          {group.notes.map(note => <button key={note} type="button" aria-pressed={value === note} onClick={() => { onChange(note); setOpen(false); trigger.current?.focus(); }} className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-xs hover:bg-[#edf7f2] focus-visible:bg-[#edf7f2] ${value === note ? 'bg-[#edf7f2] text-[#1D4532]' : 'text-[#43574a]'}`}>
            <span className="min-w-0 flex-1 truncate font-medium">{noteLabel(note, isFlute)}</span>{value === note && <Check className="h-4 w-4 shrink-0" />}
          </button>)}
        </div>)}
        {!visibleGroups.length && <p className="px-3 py-4 text-xs font-normal text-[#64776b]">Không tìm thấy nốt phù hợp.</p>}
      </div>
    </div>}
  </div>;
}
