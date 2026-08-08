import { useCallback, useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { ArrowLeft, GraduationCap, ClipboardList, HelpCircle, Gamepad2, Pencil, Plus, Trash2, X } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { lessonDetailApi } from '../../api/management';
import {
  exercisesApi,
  minigamesApi,
  quizzesApi,
  type Exercise,
  type ExerciseInput,
  type Minigame,
  type MinigameInput,
  type Quiz,
  type QuizInput,
} from '../../api/lessonContent';
import type { Lesson } from '../../api/types';

type Tab = 'exercises' | 'quizzes' | 'minigames';

const getChallengeTypeLabel = (type: string) => {
  switch (type.toUpperCase()) {
    case 'RHYTHM':
      return 'Gõ theo nhịp';
    case 'PITCH':
      return 'Đoán cao độ';
    case 'LISTENING':
      return 'Luyện nghe';
    default:
      return type;
  }
};

const emptyExercise: ExerciseInput = { title: '', description: '', passThreshold: 80, orderIndex: 1 };
const emptyQuiz = { question: '', optionsText: '', correctAnswer: '', orderIndex: 1 };
const emptyMinigame: MinigameInput = {
  title: '', challengeType: 'RHYTHM', difficulty: 'BEGINNER', maxScore: 100, orderIndex: 1, contentJson: '{}',
};

const parseOptions = (value: string) => {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
};

const InstructorLessonContent = () => {
  const lessonId = Number(useParams().lessonId);
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [minigames, setMinigames] = useState<Minigame[]>([]);
  const [tab, setTab] = useState<Tab>('exercises');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [exerciseForm, setExerciseForm] = useState<ExerciseInput>(emptyExercise);
  const [quizForm, setQuizForm] = useState(emptyQuiz);
  const [minigameForm, setMinigameForm] = useState<MinigameInput>(emptyMinigame);

  const loadContent = useCallback(async () => {
    if (!Number.isFinite(lessonId)) return;
    setLoading(true);
    setError('');
    try {
      const [lessonData, quizData, minigameData] = await Promise.all([
        lessonDetailApi.get(lessonId), quizzesApi.list(lessonId), minigamesApi.list(lessonId),
      ]);
      const exerciseData: Exercise[] = (lessonData.exercises ?? []).map((item) => ({
        id: item.id,
        lessonId,
        title: item.title,
        description: item.description,
        passThreshold: item.passThreshold,
        orderIndex: item.orderIndex ?? 0,
      }));
      setLesson(lessonData);
      setExercises(exerciseData.sort((a, b) => a.orderIndex - b.orderIndex));
      setQuizzes(quizData.sort((a, b) => a.orderIndex - b.orderIndex));
      setMinigames(minigameData.sort((a, b) => a.orderIndex - b.orderIndex));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Không thể tải nội dung bài giảng.');
    } finally {
      setLoading(false);
    }
  }, [lessonId]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadContent(), 0);
    return () => window.clearTimeout(timer);
  }, [loadContent]);

  const openCreate = () => {
    setEditingId(null);
    if (tab === 'exercises') {
      const beatMapAsset = lesson?.mediaAssets?.find((asset) => asset.assetType === 'BEAT_MAP');
      setExerciseForm({ ...emptyExercise, beatMapAssetId: beatMapAsset?.id, orderIndex: exercises.length + 1 });
    }
    if (tab === 'quizzes') setQuizForm({ ...emptyQuiz, orderIndex: quizzes.length + 1 });
    if (tab === 'minigames') setMinigameForm({ ...emptyMinigame, orderIndex: minigames.length + 1 });
    setEditorOpen(true);
  };

  const openExercise = (item: Exercise) => {
    setEditingId(item.id);
    setExerciseForm({
      title: item.title, description: item.description ?? '', beatMapAssetId: item.beatMapAssetId,
      passThreshold: item.passThreshold ?? 80, orderIndex: item.orderIndex,
    });
    setEditorOpen(true);
  };

  const openQuiz = (item: Quiz) => {
    setEditingId(item.id);
    setQuizForm({
      question: item.question, optionsText: parseOptions(item.options).join('\n'),
      correctAnswer: item.correctAnswer ?? '', orderIndex: item.orderIndex,
    });
    setEditorOpen(true);
  };

  const openMinigame = (item: Minigame) => {
    setEditingId(item.id);
    setMinigameForm({
      title: item.title, challengeType: item.challengeType, difficulty: item.difficulty ?? 'BEGINNER',
      maxScore: item.maxScore, orderIndex: item.orderIndex, contentJson: item.contentJson ?? '{}',
    });
    setEditorOpen(true);
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (tab === 'exercises') {
        const body: ExerciseInput = {
          ...exerciseForm,
          title: exerciseForm.title.trim(),
          description: exerciseForm.description?.trim(),
        };
        if (!editingId && !body.beatMapAssetId) {
          throw new Error('Vui lòng chọn tài nguyên bản đồ nhịp điệu trước khi tạo bài tập.');
        }
        if (editingId) await exercisesApi.update(editingId, body);
        else await exercisesApi.create(lessonId, body);
      } else if (tab === 'quizzes') {
        const options = quizForm.optionsText.split('\n').map((item) => item.trim()).filter(Boolean);
        if (options.length < 2) throw new Error('Quiz cần ít nhất hai lựa chọn.');
        if (!options.includes(quizForm.correctAnswer.trim())) throw new Error('Đáp án đúng phải trùng với một lựa chọn.');
        const body: QuizInput = {
          question: quizForm.question.trim(), options: JSON.stringify(options),
          correctAnswer: quizForm.correctAnswer.trim(), orderIndex: quizForm.orderIndex,
        };
        if (editingId) await quizzesApi.update(editingId, body);
        else await quizzesApi.create(lessonId, body);
      } else {
        if (minigameForm.contentJson) JSON.parse(minigameForm.contentJson);
        if (editingId) await minigamesApi.update(editingId, minigameForm);
        else await minigamesApi.create(lessonId, minigameForm);
      }
      setEditorOpen(false);
      await loadContent();
    } catch (cause) {
      setError(cause instanceof SyntaxError ? 'Cấu hình JSON của minigame không hợp lệ.' : cause instanceof Error ? cause.message : 'Không thể lưu nội dung.');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: number) => {
    if (!window.confirm('Bạn có chắc muốn xóa nội dung này?')) return;
    setError('');
    try {
      if (tab === 'exercises') await exercisesApi.remove(id);
      else if (tab === 'quizzes') await quizzesApi.remove(id);
      else await minigamesApi.remove(id);
      await loadContent();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Không thể xóa nội dung.');
    }
  };

  const tabs = [
    { id: 'exercises' as const, label: 'Bài tập', count: exercises.length, icon: ClipboardList },
    { id: 'quizzes' as const, label: 'Quiz', count: quizzes.length, icon: HelpCircle },
    { id: 'minigames' as const, label: 'Minigame', count: minigames.length, icon: Gamepad2 },
  ];

  const itemActions = (id: number, onEdit: () => void) => (
    <div className="flex gap-2 shrink-0">
      <button onClick={onEdit} className="p-2 rounded-lg border border-outline-variant/20 text-[#1D4532] hover:bg-[#1D4532]/5" title="Chỉnh sửa"><Pencil className="w-4 h-4" /></button>
      <button onClick={() => void remove(id)} className="p-2 rounded-lg border border-red-200 text-red-700 hover:bg-red-50" title="Xóa"><Trash2 className="w-4 h-4" /></button>
    </div>
  );

  return (
    <div className="max-w-[1200px] mx-auto">
      <Link to="/instructor/lessons" className="inline-flex items-center gap-2 text-sm font-semibold text-on-surface-variant hover:text-[#1D4532] mb-5">
        <ArrowLeft className="w-4 h-4" /> Quay lại danh sách bài giảng
      </Link>

      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1D4532] via-[#22523b] to-[#2e684d] text-white p-5 md:p-6 shadow-md mb-6">
        <div className="absolute -right-12 -top-16 w-56 h-56 rounded-full border-[34px] border-white/5" />
        <GraduationCap className="w-7 h-7 mb-2 text-[#ffe088]" />
        <p className="text-[10px] uppercase tracking-[0.22em] text-white/65 mb-1">Không gian biên soạn</p>
        <h1 className="text-xl md:text-2xl font-bold max-w-3xl">{lesson?.title ?? 'Nội dung bài giảng'}</h1>
        <p className="mt-1.5 text-white/70 max-w-2xl text-xs md:text-sm">Xây dựng bài tập thực hành, câu hỏi kiểm tra và trải nghiệm tương tác trong cùng một luồng.</p>
      </section>

      {error && <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-red-800">{error}</div>}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
        <div className="flex gap-2 bg-white p-1.5 rounded-xl border border-outline-variant/10 shadow-sm overflow-x-auto">
          {tabs.map(({ id, label, count, icon: Icon }) => (
            <button key={id} onClick={() => { setTab(id); setEditorOpen(false); }} className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-semibold whitespace-nowrap transition-colors ${tab === id ? 'bg-[#1D4532] text-white' : 'text-on-surface-variant hover:bg-[#f5f3ee]'}`}>
              <Icon className="w-4 h-4" /> {label} <span className={`text-xs px-2 py-0.5 rounded-full ${tab === id ? 'bg-white/20' : 'bg-[#eae8e3]'}`}>{count}</span>
            </button>
          ))}
        </div>
        <button onClick={openCreate} className="inline-flex justify-center items-center gap-2 bg-[#1D4532] text-white px-5 py-3 rounded-xl font-bold shadow-md hover:opacity-90">
          <Plus className="w-5 h-5" /> Thêm {tabs.find((item) => item.id === tab)?.label.toLowerCase()}
        </button>
      </div>

      <section className="bg-white rounded-2xl border border-outline-variant/10 shadow-sm overflow-hidden">
        {loading ? <div className="p-12 text-center text-on-surface-variant">Đang tải nội dung...</div> : (
          <div className="divide-y divide-outline-variant/10">
            {tab === 'exercises' && exercises.map((item) => (
              <article key={item.id} className="p-5 flex items-start justify-between gap-4 hover:bg-[#fbf9f4]">
                <div><p className="text-xs text-[#1D4532] font-bold mb-1">BÀI TẬP #{item.orderIndex}</p><h3 className="font-bold text-lg">{item.title}</h3><p className="text-sm text-on-surface-variant mt-1">{item.description || 'Chưa có mô tả'} · Ngưỡng đạt {item.passThreshold ?? 0}%</p></div>
                {itemActions(item.id, () => openExercise(item))}
              </article>
            ))}
            {tab === 'quizzes' && quizzes.map((item) => (
              <article key={item.id} className="p-5 flex items-start justify-between gap-4 hover:bg-[#fbf9f4]">
                <div><p className="text-xs text-[#1D4532] font-bold mb-1">CÂU HỎI #{item.orderIndex}</p><h3 className="font-bold text-lg">{item.question}</h3><div className="flex flex-wrap gap-2 mt-2">{parseOptions(item.options).map((option) => <span key={option} className="text-xs bg-[#f0eee9] px-3 py-1 rounded-full">{option}</span>)}</div></div>
                {itemActions(item.id, () => openQuiz(item))}
              </article>
            ))}
            {tab === 'minigames' && minigames.map((item) => (
              <article key={item.id} className="p-5 flex items-start justify-between gap-4 hover:bg-[#fbf9f4]">
                <div><p className="text-xs text-[#1D4532] font-bold mb-1">{getChallengeTypeLabel(item.challengeType)} · {item.difficulty || 'CHƯA PHÂN LOẠI'}</p><h3 className="font-bold text-lg">{item.title}</h3><p className="text-sm text-on-surface-variant mt-1">Điểm tối đa {item.maxScore} · Thứ tự {item.orderIndex}</p></div>
                {itemActions(item.id, () => openMinigame(item))}
              </article>
            ))}
            {((tab === 'exercises' && exercises.length === 0) || (tab === 'quizzes' && quizzes.length === 0) || (tab === 'minigames' && minigames.length === 0)) && (
              <div className="p-14 text-center"><p className="font-bold text-lg">Chưa có nội dung</p><p className="text-on-surface-variant mt-1">Bắt đầu bằng nút thêm nội dung phía trên.</p></div>
            )}
          </div>
        )}
      </section>

      {editorOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex justify-end" onMouseDown={() => setEditorOpen(false)}>
          <div className="w-full max-w-xl h-full bg-white p-6 md:p-8 overflow-y-auto shadow-2xl" onMouseDown={(event) => event.stopPropagation()}>
            <div className="flex justify-between items-start mb-7"><div><p className="text-xs tracking-widest text-[#1D4532] font-bold uppercase">{editingId ? 'Chỉnh sửa' : 'Tạo mới'}</p><h2 className="text-2xl font-bold mt-1">{tabs.find((item) => item.id === tab)?.label}</h2></div><button onClick={() => setEditorOpen(false)} className="p-2 rounded-full hover:bg-[#f0eee9]"><X className="w-5 h-5" /></button></div>
            {error && (
              <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                {error}
              </div>
            )}            <form onSubmit={(event) => void submit(event)} className="space-y-5">
              {tab === 'exercises' && <>
                <Field label="Tên bài tập"><input required value={exerciseForm.title} onChange={(e) => setExerciseForm({ ...exerciseForm, title: e.target.value })} className="input" /></Field>
                <Field label="Mô tả"><textarea value={exerciseForm.description} onChange={(e) => setExerciseForm({ ...exerciseForm, description: e.target.value })} className="input min-h-28" /></Field>
                <div className="grid grid-cols-2 gap-4"><Field label="Ngưỡng đạt (%)"><input type="number" min="0" max="100" required value={exerciseForm.passThreshold} onChange={(e) => setExerciseForm({ ...exerciseForm, passThreshold: Number(e.target.value) })} className="input" /></Field><Field label="Thứ tự"><input type="number" min="0" required value={exerciseForm.orderIndex} onChange={(e) => setExerciseForm({ ...exerciseForm, orderIndex: Number(e.target.value) })} className="input" /></Field></div>
                <Field label={`Mã tài nguyên bản đồ nhịp điệu (Beat Map Asset ID)${editingId ? ' (không bắt buộc khi cập nhật)' : ''}`}>
                  <input type="number" min="1" required={!editingId} value={exerciseForm.beatMapAssetId ?? ''} onChange={(e) => setExerciseForm({ ...exerciseForm, beatMapAssetId: e.target.value ? Number(e.target.value) : undefined })} placeholder="Nhập ID tài nguyên BEAT_MAP" className="input" />
                  <span className="mt-2 block text-xs text-on-surface-variant">Hệ thống cần một tài nguyên đa phương tiện hợp lệ để liên kết với bài tập mới.</span>
                </Field>
              </>}
              {tab === 'quizzes' && <>
                <Field label="Câu hỏi"><textarea required value={quizForm.question} onChange={(e) => setQuizForm({ ...quizForm, question: e.target.value })} className="input min-h-24" /></Field>
                <Field label="Các lựa chọn (mỗi dòng một đáp án)"><textarea required value={quizForm.optionsText} onChange={(e) => setQuizForm({ ...quizForm, optionsText: e.target.value })} placeholder={'Đáp án A\nĐáp án B\nĐáp án C'} className="input min-h-32" /></Field>
                <Field label="Đáp án đúng"><input required value={quizForm.correctAnswer} onChange={(e) => setQuizForm({ ...quizForm, correctAnswer: e.target.value })} className="input" /></Field>
                <Field label="Thứ tự"><input type="number" min="0" value={quizForm.orderIndex} onChange={(e) => setQuizForm({ ...quizForm, orderIndex: Number(e.target.value) })} className="input" /></Field>
              </>}
              {tab === 'minigames' && <>
                <Field label="Tên minigame"><input required value={minigameForm.title} onChange={(e) => setMinigameForm({ ...minigameForm, title: e.target.value })} className="input" /></Field>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Loại thử thách">
                    <select
                      value={minigameForm.challengeType}
                      onChange={(e) => setMinigameForm({ ...minigameForm, challengeType: e.target.value })}
                      className="input cursor-pointer"
                    >
                      <option value="RHYTHM">Gõ theo nhịp (Rhythm)</option>
                      <option value="PITCH">Đoán cao độ (Pitch)</option>
                      <option value="LISTENING">Luyện nghe cảm âm (Listening)</option>
                    </select>
                  </Field>
                  <Field label="Độ khó"><select value={minigameForm.difficulty} onChange={(e) => setMinigameForm({ ...minigameForm, difficulty: e.target.value })} className="input cursor-pointer"><option value="BEGINNER">Cơ bản</option><option value="INTERMEDIATE">Trung cấp</option><option value="ADVANCED">Nâng cao</option></select></Field>
                </div>
                <div className="grid grid-cols-2 gap-4"><Field label="Điểm tối đa"><input type="number" min="1" required value={minigameForm.maxScore} onChange={(e) => setMinigameForm({ ...minigameForm, maxScore: Number(e.target.value) })} className="input" /></Field><Field label="Thứ tự"><input type="number" min="0" required value={minigameForm.orderIndex} onChange={(e) => setMinigameForm({ ...minigameForm, orderIndex: Number(e.target.value) })} className="input" /></Field></div>
                <Field label="Cấu hình chi tiết (JSON)"><textarea value={minigameForm.contentJson} onChange={(e) => setMinigameForm({ ...minigameForm, contentJson: e.target.value })} className="input min-h-40 font-mono text-sm" /></Field>
              </>}
              <button disabled={saving} className="w-full bg-[#1D4532] text-white rounded-xl py-3.5 font-bold disabled:opacity-60">{saving ? 'Đang lưu...' : editingId ? 'Lưu thay đổi' : 'Tạo nội dung'}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const Field = ({ label, children }: { label: string; children: ReactNode }) => (
  <label className="block"><span className="block text-sm font-semibold mb-2 text-on-surface-variant">{label}</span>{children}</label>
);

export default InstructorLessonContent;
