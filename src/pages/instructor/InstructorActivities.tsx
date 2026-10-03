import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { apiRequest, ApiError } from '../../api/client';
import { masterDataApi } from '../../api/services';
import type { Instrument } from '../../api/types';
import type { MinigameInput, QuizInput } from '../../api/lessonContent';
import QuizEditor from '../../components/instructor/QuizEditor';
import MinigameComposer from '../../components/instructor/MinigameComposer';

const initialMinigame: MinigameInput = {
  title: '', challengeType: 'RHYTHM_MATCH', difficulty: 'BEGINNER',
  maxScore: 100, orderIndex: 1, status: 'ACTIVE', contentJson: '{}',
};

const InstructorActivities = () => {
  const kind = useLocation().pathname.endsWith('/minigame') ? 'minigame' : 'quiz';
  return <ActivityComposer key={kind} kind={kind} />;
};

const ActivityComposer = ({ kind }: { kind: 'quiz' | 'minigame' }) => {
  const [instruments, setInstruments] = useState<Instrument[]>([]);
  const [instrumentId, setInstrumentId] = useState<number | null>(null);
  const [loadError, setLoadError] = useState('');
  const [saveError, setSaveError] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState<MinigameInput>(initialMinigame);
  const [quizFormKey, setQuizFormKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [retry, setRetry] = useState(0);
  const noticeRef = useRef<HTMLParagraphElement>(null);
  const activeInstrument = instruments.find(item => item.id === instrumentId);
  const unavailable = loading || !!loadError || !activeInstrument;

  useEffect(() => {
    if (saved || saveError) {
      noticeRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' });
      noticeRef.current?.focus({ preventScroll: true });
    }
  }, [saved, saveError]);

  useEffect(() => {
    const controller = new AbortController();
    masterDataApi.instruments({ signal: controller.signal })
      .then((items) => {
        if (controller.signal.aborted) return;
        setInstruments(items);
        setInstrumentId((current) => current ?? items[0]?.id ?? null);
      })
      .catch(() => {
        if (!controller.signal.aborted) setLoadError('Chưa tải được danh sách nhạc cụ. Vui lòng kiểm tra kết nối và thử lại.');
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [retry]);

  const create = async (body: QuizInput | MinigameInput) => {
    if (unavailable || saving) return;
    setSaving(true);
    setSaved(false);
    setSaveError('');
    try {
      // BE contract required: activities belong to an instrument, not a lesson.
      await apiRequest(`/api/instruments/${instrumentId}/${kind === 'quiz' ? 'quizzes' : 'minigames'}`, {
        method: 'POST', body,
      });
      setSaved(true);
      if (kind === 'quiz') setQuizFormKey((key) => key + 1);
      else { setForm(initialMinigame); setQuizFormKey(key => key + 1); }
    } catch (error) {
      setSaveError(error instanceof ApiError && error.status === 403
        ? 'Bạn chưa có quyền tạo hoạt động cho nhạc cụ này. Vui lòng liên hệ quản trị viên.'
        : error instanceof ApiError && error.status === 401
          ? 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại để tiếp tục.'
          : 'Chưa thể lưu hoạt động. Nội dung đã nhập vẫn được giữ lại. Vui lòng thử lại sau.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-lg pb-8">
      <header>
        <h2 className="text-headline-lg font-bold text-[#1D4532]" style={{ fontFamily: "'Montserrat', sans-serif" }}>Biên soạn {kind === 'quiz' ? 'Quiz' : 'Minigame'}</h2>
        <p className="mt-1 text-on-surface-variant">{kind === 'quiz' ? 'Tạo câu hỏi và đáp án để học viên củng cố kiến thức.' : 'Tạo thử thách nhịp điệu và giai điệu cho học viên luyện tập.'}</p>
      </header>

      <section aria-label="Phạm vi nhạc cụ" className="flex flex-col gap-3 rounded-2xl border border-[#d8eadf] bg-[#f7fbf8] p-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#567364]">Nhạc cụ đang biên soạn</p>
          <p className="mt-1 text-lg font-bold text-[#1D4532]">{loading ? 'Đang tải nhạc cụ…' : loadError ? 'Chưa tải được nhạc cụ' : activeInstrument?.name ?? 'Chưa có nhạc cụ'}</p>
          <p className="mt-1 text-xs text-on-surface-variant">{!loading && !loadError && !instruments.length ? 'Vui lòng liên hệ quản trị viên để thêm nhạc cụ.' : 'Hoạt động sẽ được lưu cho nhạc cụ bạn chọn.'}</p>
          {loadError && <div role="alert" className="mt-2 text-sm text-red-700">{loadError} <button type="button" onClick={() => { setLoading(true); setLoadError(''); setRetry(value => value + 1); }} className="font-semibold underline">Thử tải lại</button></div>}
        </div>
        <label htmlFor="activity-instrument" className="flex min-w-0 flex-col gap-1 text-xs font-semibold text-[#52605a] md:w-[250px]">Chuyển nhạc cụ
        <select id="activity-instrument" value={instrumentId ?? ''}
          disabled={saving || unavailable}
          onChange={(event) => { setInstrumentId(Number(event.target.value)); setSaved(false); setSaveError(''); }}
          className="rounded-lg border border-[#c9ddcf] bg-white px-3 py-2.5 text-sm font-bold text-[#1D4532] outline-none focus:ring-2 focus:ring-[#1D4532]/20 disabled:opacity-60">
          {!instruments.length && <option value="">{loading ? 'Đang tải…' : 'Chưa có nhạc cụ'}</option>}
          {instruments.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
        </select>
        </label>
      </section>

      {saved && <p ref={noticeRef} tabIndex={-1} role="status" className="flex items-start gap-2 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800"><CheckCircle2 className="h-5 w-5 shrink-0" />Đã tạo {kind === 'quiz' ? 'Quiz' : 'Minigame'} cho {activeInstrument?.name}.</p>}
      {saveError && <p ref={noticeRef} tabIndex={-1} role="alert" className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"><AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />{saveError}</p>}

      {kind === 'quiz' ? (
        <section className="overflow-hidden rounded-2xl border border-outline-variant/15 bg-[#fbf9f4]">
          <div className="border-b border-[#e4e9e5] bg-white px-4 py-4 sm:px-6"><h3 className="font-bold text-[#1D4532]">Câu hỏi mới</h3><p className="mt-1 text-xs text-on-surface-variant">Nhập câu hỏi, thêm lựa chọn và đánh dấu đáp án đúng.</p></div>
          <QuizEditor key={quizFormKey} initial={null} defaultOrderIndex={1} saving={saving} disabled={unavailable} standalone
            instrument={instruments.find((item) => item.id === instrumentId)?.name.toLowerCase().includes('sáo') ? 'sao_truc' : 'dan_tranh'}
            onCancel={() => { setSaved(false); setSaveError(''); setQuizFormKey((key) => key + 1); }}
            onSubmit={(body) => { void create(body); }} />
        </section>
      ) : (
        <MinigameComposer key={quizFormKey} initial={form} saving={saving} disabled={unavailable}
          onReset={() => { setSaveError(''); setSaved(false); setQuizFormKey(key => key + 1); }}
          onSubmit={body => { void create(body); }} />
      )}
    </div>
  );
};

export default InstructorActivities;
