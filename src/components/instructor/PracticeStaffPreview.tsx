import type { PracticeSheetEvent } from './PracticeSheetComposer';

// Same diatonic coordinates as StaffDisplay.gd's ZT_ notes:
// Mi2/E4 = bottom staff line, Do2/C4 = first ledger below.
export function staffPosition(note: string): number {
  const normalized = note.replace(/^ZT_/, '').replace(/_/g, '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/Đ/g, 'D');
  const match = /^(Do|Re|Mi|Fa|Sol|La|Si)([1-4])$/.exec(normalized);
  if (!match) return 0;
  return ((Number(match[2]) - 2) * 7 + ['Do', 'Re', 'Mi', 'Fa', 'Sol', 'La', 'Si'].indexOf(match[1]) - 2) / 2;
}

export default function PracticeStaffPreview({ events }: { events: PracticeSheetEvent[] }) {
  const spacing = 16;
  const positions = events.flatMap(event => event.notes.map(staffPosition));
  const highest = Math.max(4, ...positions);
  const lowest = Math.min(0, ...positions);
  const bottom = 48 + highest * spacing;
  const y = (position: number) => bottom - position * spacing;
  const fingerY = y(lowest) + 54;
  const height = fingerY + Math.max(1, ...events.map(event => event.fingering.length)) * 18 + 12;
  const width = Math.max(480, 160 + events.length * 62);
  return (
    <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Khuông khóa Sol, nhịp 4/4" className="block w-full" style={{ minWidth: events.length > 5 ? width : undefined }}>
      <g stroke="#514b40" strokeWidth="1.3">
        {[0, 1, 2, 3, 4].map(position => <line key={position} x1="12" x2={width - 12} y1={y(position)} y2={y(position)} />)}
        <line x1="12" x2="12" y1={y(4)} y2={y(0)} />
      </g>
      <text x="14" y={y(0) + 8} fontFamily="Segoe UI Symbol, Noto Music, serif" fontSize="94" fill="#151515">𝄞</text>
      <g fontFamily="Georgia, serif" fontSize="38" fontWeight="bold" textAnchor="middle" fill="#302d29">
        <text x="94" y={y(2) - 2}>4</text><text x="94" y={y(0) - 2}>4</text>
      </g>
      {events.map((event, index) => {
        const x = 150 + index * 62;
        const notes = event.notes.map((note, noteIndex) => ({ note, noteIndex, position: staffPosition(note) })).sort((a, b) => a.position - b.position);
        const low = notes[0]?.position ?? 0;
        const high = notes.at(-1)?.position ?? 0;
        const up = (low + high) / 2 < 2;
        const stemX = x + (up ? 9 : -9);
        const tip = up ? y(high) - 35 : y(low) + 35;
        const ledgers: number[] = [];
        for (let p = -1; p >= low; p--) ledgers.push(p);
        for (let p = 5; p <= high; p++) ledgers.push(p);
        const markY = Math.min(y(high) - 21, up ? tip - 10 : Infinity);
        return <g key={index} fill="#151515">
          <title>{event.notes.join(' + ')} · {event.duration === 'half' ? 'Nốt trắng' : 'Nốt đen'}</title>
          {ledgers.map(p => <line key={p} x1={x - 16} x2={x + 16} y1={y(p)} y2={y(p)} stroke="#514b40" strokeWidth="1.5" />)}
          <line x1={stemX} x2={stemX} y1={up ? y(low) : y(high)} y2={tip} stroke="#151515" strokeWidth="1.8" />
          {notes.map(({ noteIndex, position }, i) => {
            // Adjacent chord tones sit on opposite sides of the shared stem.
            const displaced = i > 0 && position - notes[i - 1].position === 0.5 && i % 2 === 1;
            const headX = x + (displaced ? (up ? 18 : -18) : 0);
            return <ellipse key={noteIndex} cx={headX} cy={y(position)} rx="10" ry="6.3" transform={`rotate(-18 ${headX} ${y(position)})`} fill={event.duration === 'half' ? '#fffef9' : '#151515'} stroke="#151515" strokeWidth="1.8" />;
          })}
          {event.technique === 'nhan' && <text x={x} y={markY} textAnchor="middle" fontSize="21">*</text>}
          {event.technique === 'rung' && <path d={`M ${x - 15} ${markY} q 5 -8 10 0 t 10 0 t 10 0`} fill="none" stroke="#151515" strokeWidth="1.5" />}
          {event.technique === 've' && [0, 1, 2].map(i => <line key={i} x1={stemX - 6} x2={stemX + 6} y1={tip + (up ? 12 : -12) + i * 5} y2={tip + (up ? 6 : -18) + i * 5} stroke="#151515" strokeWidth="2" />)}
          {event.technique === 'a' && <text x={x} y={markY} fontSize="14" textAnchor="middle">Á ↗</text>}
          {event.fingering.map((finger, i) => <text key={i} x={x} y={fingerY + i * 18} textAnchor="middle" fontSize="15" fontWeight="bold">{finger}</text>)}
        </g>;
      })}
      {events.length === 0 && <text x="148" y={fingerY} fontSize="12" fill="#718078">Thêm nốt để xem trước.</text>}
    </svg>
  );
}
