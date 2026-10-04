import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { ApiError } from '../../api/client';
import { masterDataApi } from '../../api/services';
import { instrumentMinigamesApi, instrumentQuizzesApi } from '../../api/lessonContent';
import type { Minigame, MinigameInput, Quiz, QuizInput } from '../../api/lessonContent';
import type { Instrument } from '../../api/types';
import QuizEditor from '../../components/instructor/QuizEditor';
import MinigameComposer from '../../components/instructor/MinigameComposer';

const emptyMinigame: MinigameInput = { title: '', challengeType: 'RHYTHM_MATCH', difficulty: 'BEGINNER', maxScore: 100, orderIndex: 1, status: 'ACTIVE', contentJson: '{}' };
const statusLabel: Record<string, string> = { ACTIVE: 'Đang phát hành', INACTIVE: 'Tạm ẩn', ARCHIVED: 'Lưu trữ' };
const challengeLabel: Record<string, string> = { RHYTHM_MATCH: 'Khớp nhịp', MELODY_COMPLETE: 'Hoàn thiện giai điệu' };
const quizLabel: Record<string, string> = { GENERAL: 'Kiến thức chung', NOTE_IDENTIFICATION: 'Nhận diện nốt nhạc' };
const message = (error: unknown, action: string) => error instanceof ApiError && error.status === 403 ? 'Bạn không có quyền quản lý hoạt động này.' : error instanceof ApiError && error.status === 401 ? 'Phiên đăng nhập đã hết hạn.' : `Không thể ${action}. Vui lòng thử lại.`;

export default function InstructorActivities() {
  const kind = useLocation().pathname.endsWith('/minigame') ? 'minigame' : 'quiz';
  return <Manager key={kind} kind={kind} />;
}

function Manager({ kind }: { kind: 'quiz' | 'minigame' }) {
  const [instruments, setInstruments] = useState<Instrument[]>([]);
  const [instrumentId, setInstrumentId] = useState<number | null>(null);
  const [items, setItems] = useState<Array<Quiz | Minigame>>([]);
  const [editing, setEditing] = useState<Quiz | Minigame | null>(null);
  const [deleting, setDeleting] = useState<Quiz | Minigame | null>(null);
  const [formKey, setFormKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [listLoading, setListLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [reload, setReload] = useState(0);
  const label = kind === 'quiz' ? 'Quiz' : 'Minigame';
  const instrument = instruments.find(item => item.id === instrumentId);

  useEffect(() => {
    const controller = new AbortController();
    masterDataApi.instruments({ signal: controller.signal }).then(data => {
      if (controller.signal.aborted) return;
      setInstruments(data); setInstrumentId(data[0]?.id ?? null);
    }).catch(caught => { if (!controller.signal.aborted) setError(message(caught, 'tải nhạc cụ')); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (instrumentId === null) return;
    const controller = new AbortController();
    setListLoading(true);
    const request = kind === 'quiz' ? instrumentQuizzesApi.list(instrumentId, controller.signal) : instrumentMinigamesApi.list(instrumentId, controller.signal);
    request.then(data => { if (!controller.signal.aborted) setItems(data); })
      .catch(caught => { if (!controller.signal.aborted) { setItems([]); setError(message(caught, `tải danh sách ${label}`)); } })
      .finally(() => { if (!controller.signal.aborted) setListLoading(false); });
    return () => controller.abort();
  }, [instrumentId, kind, reload, label]);

  const reset = () => { setEditing(null); setFormKey(value => value + 1); };
  const save = async (body: QuizInput | MinigameInput) => {
    if (instrumentId === null || busy) return;
    setBusy(true); setError(''); setNotice('');
    try {
      if (kind === 'quiz') {
        if (editing) await instrumentQuizzesApi.update(editing.id, body as QuizInput);
        else await instrumentQuizzesApi.create(instrumentId, body as QuizInput);
      } else {
        if (editing) await instrumentMinigamesApi.update(editing.id, body as MinigameInput);
        else await instrumentMinigamesApi.create(instrumentId, body as MinigameInput);
      }
      setNotice(`${editing ? 'Đã cập nhật' : 'Đã tạo'} ${label}.`); reset(); setReload(value => value + 1);
    } catch (caught) { setError(message(caught, `lưu ${label}`)); }
    finally { setBusy(false); }
  };
  const remove = async () => {
    if (!deleting || busy) return;
    setBusy(true); setError(''); setNotice('');
    try {
      if (kind === 'quiz') await instrumentQuizzesApi.remove(deleting.id);
      else await instrumentMinigamesApi.remove(deleting.id);
      if (editing?.id === deleting.id) reset();
      setDeleting(null); setNotice(`Đã xóa ${label}. Hoạt động có lượt chơi sẽ được lưu trữ để giữ lịch sử.`); setReload(value => value + 1);
    } catch (caught) { setError(message(caught, `xóa ${label}`)); }
    finally { setBusy(false); }
  };

  return <div className="space-y-6 pb-8">
    <header><h2 className="text-headline-lg font-bold text-[#1D4532]">Quản lý {label}</h2><p className="mt-1 text-on-surface-variant">Tạo, xem, sửa và xóa hoạt động theo nhạc cụ.</p></header>
    <section className="rounded-2xl border border-[#d8eadf] bg-[#f7fbf8] p-4">
      <label htmlFor="activity-instrument" className="block text-sm font-semibold">Nhạc cụ</label>
      <select id="activity-instrument" className="input mt-2 max-w-sm" value={instrumentId ?? ''} disabled={loading || busy} onChange={event => { setInstrumentId(Number(event.target.value)); setItems([]); setError(''); setNotice(''); setDeleting(null); reset(); }}>
        {!instruments.length && <option value="">{loading ? 'Đang tải…' : 'Chưa có nhạc cụ'}</option>}
        {instruments.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
      </select>
    </section>
    {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</p>}
    {notice && <p role="status" className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800">{notice}</p>}
    <section aria-label={`Danh sách ${label}`} className="overflow-hidden rounded-2xl border border-[#d8eadf] bg-white">
      <div className="flex items-center justify-between gap-3 border-b p-4"><div><h3 className="font-bold text-[#1D4532]">{label} của {instrument?.name ?? 'nhạc cụ'}</h3><p className="text-xs text-on-surface-variant">{items.length} hoạt động</p></div><button type="button" disabled={listLoading || !instrumentId} onClick={() => setReload(value => value + 1)} className="rounded-lg border px-3 py-2 text-sm disabled:opacity-50">Tải lại</button></div>
      {listLoading ? <p className="p-5 text-sm">Đang tải danh sách…</p> : items.length === 0 ? <p className="p-5 text-sm">Chưa có {label} cho nhạc cụ này.</p> : <ul className="divide-y">{items.map(item => <li key={item.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
        <div><p className="font-semibold text-[#1D4532]">{item.title}</p><p className="text-xs text-on-surface-variant">{kind === 'quiz' ? quizLabel[(item as Quiz).questionType] ?? (item as Quiz).questionType : challengeLabel[(item as Minigame).challengeType] ?? (item as Minigame).challengeType} · {statusLabel[item.status ?? 'ACTIVE'] ?? item.status} · Thứ tự {item.orderIndex}</p></div>
        <div className="flex gap-2"><button type="button" disabled={busy} onClick={() => { setEditing(item); setFormKey(value => value + 1); setError(''); }} className="rounded-lg border px-3 py-2 text-sm font-semibold disabled:opacity-50">Sửa</button><button type="button" disabled={busy} onClick={() => setDeleting(item)} className="rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 disabled:opacity-50">Xóa</button></div>
      </li>)}</ul>}
    </section>
    {deleting && <section role="alertdialog" aria-label={`Xóa ${label}`} className="rounded-xl border border-red-200 bg-red-50 p-4"><p className="font-semibold">Xóa “{deleting.title}”?</p><p className="mt-1 text-sm">Hoạt động đã có lượt chơi sẽ được lưu trữ để giữ lịch sử.</p><div className="mt-3 flex gap-2"><button type="button" disabled={busy} onClick={() => setDeleting(null)} className="rounded-lg border bg-white px-4 py-2 text-sm">Hủy</button><button type="button" disabled={busy} onClick={() => void remove()} className="rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{busy ? 'Đang xóa…' : 'Xác nhận xóa'}</button></div></section>}
    <section aria-label={editing ? `Sửa ${label}` : `Tạo ${label}`}>
      {kind === 'quiz' ? <QuizEditor key={formKey} initial={editing as Quiz | null} defaultOrderIndex={items.length + 1} saving={busy} disabled={!instrumentId || loading || listLoading} standalone={!editing} instrument={instrument?.name.toLowerCase().includes('sáo') ? 'sao_truc' : 'dan_tranh'} onCancel={reset} onSubmit={body => { void save(body); }} />
        : <MinigameComposer key={formKey} initial={(editing as Minigame | null) ?? { ...emptyMinigame, orderIndex: items.length + 1 }} editing={!!editing} saving={busy} disabled={!instrumentId || loading || listLoading} onReset={reset} onSubmit={body => { void save(body); }} />}
    </section>
  </div>;
}
