import { useCallback, useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { ArrowLeft, AudioLines, Check, ClipboardList, Gamepad2, GraduationCap, HelpCircle, Music4, Pencil, Plus, Sparkles, Timer, Trash2, X } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { lessonDetailApi } from '../../api/management';
import { lessonAssetsApi } from '../../api/services';
import type { LessonAsset } from '../../api/types';
import {
  exercisesApi,
  minigamesApi,
  quizzesApi,
  MELODY_COMPLETE_CONFIG,
  type Exercise,
  type ExerciseInput,
  type MelodyCompleteConfig,
  type Minigame,
  type MinigameInput,
  type Quiz,
  type QuizInput,
} from '../../api/lessonContent';
import type { Lesson } from '../../api/types';
import QuizEditor from '../../components/instructor/QuizEditor';

const parseQuizOptions = (value: string): string[] => {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
};

const getQuestionTypeLabel = (type?: string) =>
  type === 'NOTE_IDENTIFICATION' ? 'Nhận diện nốt nhạc' : 'Kiến thức chung';

type Tab = 'exercises' | 'quizzes' | 'minigames';

const getChallengeTypeLabel = (type: string) => {
  switch (type.toUpperCase()) {
    case 'RHYTHM_MATCH':
      return 'Gõ theo nhịp';
    case 'MELODY_COMPLETE':
      return 'Hoàn thiện giai điệu';
    default:
      return type;
  }
};

const getDifficultyLabel = (difficulty?: string) => {
  switch (difficulty?.toUpperCase()) {
    case 'BEGINNER':
      return 'Cơ bản';
    case 'INTERMEDIATE':
      return 'Trung cấp';
    case 'ADVANCED':
      return 'Nâng cao';
    default:
      return 'CHƯA PHÂN LOẠI';
  }
};

const parseMelodyConfig = (contentJson?: string): MelodyCompleteConfig => {
  const fallback: MelodyCompleteConfig = {
    melody: [],
    missing_positions: [],
    note_options: {},
    correct_answers: {},
  };
  if (!contentJson) return fallback;
  try {
    const raw = JSON.parse(contentJson) as Partial<MelodyCompleteConfig>;
    return {
      audio_asset_id: typeof raw.audio_asset_id === 'number' ? raw.audio_asset_id : undefined,
      melody: Array.isArray(raw.melody) ? raw.melody.map(String).filter(Boolean) : [],
      missing_positions: Array.isArray(raw.missing_positions)
        ? raw.missing_positions.map(Number).filter((n) => Number.isFinite(n))
        : [],
      note_options: raw.note_options ?? {},
      correct_answers: raw.correct_answers ?? {},
      bpm: typeof raw.bpm === 'number' ? raw.bpm : undefined,
      time_limit_sec: typeof raw.time_limit_sec === 'number' ? raw.time_limit_sec : undefined,
    };
  } catch {
    return fallback;
  }
};

const buildMelodyConfigJson = (config: MelodyCompleteConfig): string =>
  JSON.stringify({
    audio_asset_id: config.audio_asset_id,
    melody: config.melody,
    missing_positions: config.missing_positions,
    note_options: config.note_options,
    correct_answers: config.correct_answers,
    bpm: config.bpm,
    time_limit_sec: config.time_limit_sec,
  });

const validateMelodyDraft = (config: MelodyCompleteConfig): string | null => {
  const notes = config.melody.map((n) => n.trim()).filter(Boolean);
  if (notes.length < 2) return 'Giai điệu cần tối thiểu 2 nốt.';
  if (config.missing_positions.length === 0) return 'Vui lòng chọn ít nhất 1 vị trí nốt khuyết.';
  for (const position of config.missing_positions) {
    const options = (config.note_options[String(position)] ?? []).map((o) => o.trim()).filter(Boolean);
    if (options.length < 4) return `Vị trí ${position}: cần đủ 4 lựa chọn nốt.`;
    if (new Set(options).size !== options.length) return `Vị trí ${position}: các lựa chọn không được trùng nhau.`;
    const correct = (config.correct_answers[String(position)] ?? '').trim();
    if (!correct || !options.includes(correct)) return `Vị trí ${position}: vui lòng đánh dấu một đáp án đúng.`;
  }
  if (!config.bpm || config.bpm <= 0) return 'Tempo (bpm) phải lớn hơn 0.';
  if (!config.time_limit_sec || config.time_limit_sec <= 0) return 'Thời gian giới hạn phải lớn hơn 0.';
  return null;
};

const emptyExercise: ExerciseInput = { title: '', description: '', passThreshold: 80, orderIndex: 1 };
const emptyMinigame: MinigameInput = {
  title: '', challengeType: 'MELODY_COMPLETE', difficulty: 'BEGINNER', maxScore: 100, orderIndex: 1, contentJson: '{}',
};

// Trang biên soạn nội dung bài giảng: 3 tab Bài tập / Quiz / Minigame với CRUD qua slide-over editor
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
  const [minigameForm, setMinigameForm] = useState<MinigameInput>(emptyMinigame);
  const [melodyDraft, setMelodyDraft] = useState<MelodyCompleteConfig>(MELODY_COMPLETE_CONFIG);
  const [melodyInput, setMelodyInput] = useState('');
  const [audioAssets, setAudioAssets] = useState<LessonAsset[]>([]);

  // Tải danh sách audio của bài học khi mở editor minigame (dùng cho chọn file giai điệu)
  useEffect(() => {
    if (tab !== 'minigames' || !editorOpen) return;
    let cancelled = false;
    lessonAssetsApi
      .getAssets(lessonId)
      .then((assets) => {
        if (!cancelled) setAudioAssets(assets.filter((asset) => asset.type === 'REFERENCE_AUDIO'));
      })
      .catch(() => {
        if (!cancelled) setAudioAssets([]);
      });
    return () => {
      cancelled = true;
    };
  }, [tab, editorOpen, lessonId]);

  // Tải dữ liệu nội dung: lesson detail + quizzes + minigames + exercises (từ lessonData)
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

  // Mở editor tạo mới theo tab (tự điền beatMapAssetId từ lesson cho bài tập)
  const openCreate = () => {
    setEditingId(null);
    if (tab === 'exercises') {
      const beatMapAsset = lesson?.mediaAssets?.find((asset) => asset.assetType === 'BEAT_MAP');
      setExerciseForm({ ...emptyExercise, beatMapAssetId: beatMapAsset?.id, orderIndex: exercises.length + 1 });
    }
    if (tab === 'minigames') {
      setMinigameForm({ ...emptyMinigame, orderIndex: minigames.length + 1 });
      setMelodyDraft(MELODY_COMPLETE_CONFIG);
      setMelodyInput('');
    }
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
    setEditorOpen(true);
  };

  const openMinigame = (item: Minigame) => {
    setEditingId(item.id);
    const config = parseMelodyConfig(item.contentJson);
    setMelodyDraft(config);
    setMelodyInput(config.melody.join(' '));
    setMinigameForm({
      title: item.title, challengeType: item.challengeType, difficulty: item.difficulty ?? 'BEGINNER',
      maxScore: item.maxScore, orderIndex: item.orderIndex, contentJson: item.contentJson ?? '{}',
    });
    setEditorOpen(true);
  };

  // Submit chung: exercises -> POST/PUT /api/exercises, minigames -> validate giai điệu rồi POST/PUT /api/minigames
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
      } else {
        const validationError = validateMelodyDraft(melodyDraft);
        if (validationError) {
          setError(validationError);
          return;
        }
        const body: MinigameInput = {
          ...minigameForm,
          title: minigameForm.title.trim(),
          challengeType: 'MELODY_COMPLETE',
          difficulty: 'BEGINNER',
          maxScore: 100,
          contentJson: buildMelodyConfigJson(melodyDraft),
        };
        if (editingId) await minigamesApi.update(editingId, body);
        else await minigamesApi.create(lessonId, body);
      }
      setEditorOpen(false);
      await loadContent();
    } catch (cause) {
      setError(cause instanceof SyntaxError ? 'Cấu hình JSON của minigame không hợp lệ.' : cause instanceof Error ? cause.message : 'Không thể lưu nội dung.');
    } finally {
      setSaving(false);
    }
  };

  // Submit quiz qua QuizEditor (POST/PUT /api/quizzes)
  const submitQuiz = async (body: QuizInput) => {
    setSaving(true);
    setError('');
    try {
      if (editingId) await quizzesApi.update(editingId, body);
      else await quizzesApi.create(lessonId, body);
      setEditorOpen(false);
      await loadContent();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Không thể lưu câu hỏi.');
    } finally {
      setSaving(false);
    }
  };

  // Xóa nội dung theo tab hiện tại (có confirm)
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
      <button onClick={onEdit} className="p-2 rounded-lg border border-outline-variant/20 text-[#1D4532] hover:bg-[#1D4532]/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4532]/30 transition-all duration-200 active:scale-90" title="Chỉnh sửa"><Pencil className="w-4 h-4" /></button>
      <button onClick={() => void remove(id)} className="p-2 rounded-lg border border-red-200 text-red-700 hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-200 transition-all duration-200 active:scale-90" title="Xóa"><Trash2 className="w-4 h-4" /></button>
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
              <article key={item.id} className="p-5 flex items-start justify-between gap-4 hover:bg-[#fbf9f4] transition-colors duration-200">
                <div className="min-w-0">
                  <p className="text-[11px] uppercase tracking-[0.18em] font-bold text-[#1D4532]/70 mb-1.5">Câu hỏi <span className="tabular-nums">#{item.orderIndex}</span> · {getQuestionTypeLabel(item.questionType)}</p>
                  <h3 className="font-bold text-lg leading-snug text-pretty">{item.title || item.question}</h3>
                  {item.title && <p className="text-sm text-on-surface-variant mt-0.5 text-pretty">{item.question}</p>}
                  {item.questionType === 'NOTE_IDENTIFICATION' && item.note && (
                    <p className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-[#1D4532]">
                      <Music4 className="w-3.5 h-3.5" /> Nốt nhạc: {item.note}
                    </p>
                  )}
                  <div className="flex flex-wrap items-center gap-2 mt-3">
                    {parseQuizOptions(item.options).map((option, index) => {
                      const isCorrect = option === item.correctAnswer;
                      return (
                        <span key={`${option}-${index}`} className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full transition-colors duration-200 ${isCorrect ? 'bg-[#1D4532] text-white shadow-sm shadow-[#1D4532]/20' : 'bg-[#f0eee9] text-on-surface-variant'}`}>
                          {isCorrect && <Check className="w-3 h-3" strokeWidth={3} />}
                          {option}
                        </span>
                      );
                    })}
                  </div>
                </div>
                {itemActions(item.id, () => openQuiz(item))}
              </article>
            ))}
            {tab === 'minigames' && minigames.map((item) => {
              const config = item.challengeType === 'MELODY_COMPLETE' ? parseMelodyConfig(item.contentJson) : null;
              const difficultyClass =
                item.difficulty === 'BEGINNER' ? 'bg-emerald-50 text-emerald-700'
                  : item.difficulty === 'INTERMEDIATE' ? 'bg-amber-50 text-amber-700'
                  : item.difficulty === 'ADVANCED' ? 'bg-red-50 text-red-700'
                  : 'bg-[#f0eee9] text-on-surface-variant';
              return (
                <article key={item.id} className="p-5 flex items-start justify-between gap-4 hover:bg-[#fbf9f4]">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      {item.challengeType === 'MELODY_COMPLETE'
                        ? <Music4 className="w-4 h-4 text-[#1D4532]" />
                        : <Gamepad2 className="w-4 h-4 text-[#1D4532]" />}
                      <p className="text-xs font-bold text-[#1D4532]">{getChallengeTypeLabel(item.challengeType)}</p>
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${difficultyClass}`}>{getDifficultyLabel(item.difficulty)}</span>
                    </div>
                    <h3 className="font-bold text-lg">{item.title}</h3>
                    <p className="text-sm text-on-surface-variant mt-1">Điểm tối đa {item.maxScore} · Thứ tự {item.orderIndex}</p>
                    {config && (
                      <p className="mt-1 inline-flex flex-wrap items-center gap-3 text-xs text-on-surface-variant">
                        <span className="inline-flex items-center gap-1"><Music4 className="w-3.5 h-3.5" /> {config.melody.length} nốt · {config.missing_positions.length} vị trí khuyết</span>
                        {config.audio_asset_id && <span className="inline-flex items-center gap-1"><AudioLines className="w-3.5 h-3.5" /> Audio #{config.audio_asset_id}</span>}
                        {config.time_limit_sec && <span className="inline-flex items-center gap-1"><Timer className="w-3.5 h-3.5" /> {config.time_limit_sec}s</span>}
                      </p>
                    )}
                  </div>
                  {itemActions(item.id, () => openMinigame(item))}
                </article>
              );
            })}
            {((tab === 'exercises' && exercises.length === 0) || (tab === 'quizzes' && quizzes.length === 0) || (tab === 'minigames' && minigames.length === 0)) && (
              <div className="p-14 text-center"><p className="font-bold text-lg">Chưa có nội dung</p><p className="text-on-surface-variant mt-1">Bắt đầu bằng nút thêm nội dung phía trên.</p></div>
            )}
          </div>
        )}
      </section>

      {editorOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex justify-end animate-[fadeIn_0.25s_ease-out]" onMouseDown={() => setEditorOpen(false)}>
          <div className="w-full max-w-xl h-full bg-white p-6 md:p-8 overflow-y-auto shadow-2xl custom-scrollbar animate-[slideIn_0.32s_cubic-bezier(0.22,1,0.36,1)]" onMouseDown={(event) => event.stopPropagation()}>
            <div className="flex justify-between items-start mb-7"><div><p className="text-xs tracking-widest text-[#1D4532] font-bold uppercase">{editingId ? 'Chỉnh sửa' : 'Tạo mới'}</p><h2 className="text-2xl font-bold mt-1">{tabs.find((item) => item.id === tab)?.label}</h2></div><button onClick={() => setEditorOpen(false)} className="p-2 rounded-full hover:bg-[#f0eee9] transition-colors duration-200 active:scale-90"><X className="w-5 h-5" /></button></div>
            {tab === 'quizzes' ? (
              <QuizEditor
                initial={editingId ? quizzes.find((item) => item.id === editingId) ?? null : null}
                defaultOrderIndex={quizzes.length + 1}
                saving={saving}
                apiError={error}
                onCancel={() => setEditorOpen(false)}
                onSubmit={(body) => void submitQuiz(body)}
              />
            ) : (
              <>
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
                  {tab === 'minigames' && <>
                    <Field label="Tên minigame"><input required value={minigameForm.title} onChange={(e) => setMinigameForm({ ...minigameForm, title: e.target.value })} className="input" placeholder="Ví dụ: Hoàn thiện giai điệu — Chợt quê" /></Field>

                    <section className="rounded-2xl border border-[#1D4532]/15 bg-[#fbf9f4] p-4 space-y-5">
                      <p className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.18em] text-[#1D4532]">
                        <Sparkles className="w-3.5 h-3.5" /> Cấu hình giai điệu
                      </p>

                      <Field label="File audio giai điệu (tùy chọn)">
                        <select
                          value={melodyDraft.audio_asset_id ?? ''}
                          onChange={(e) => {
                            const assetId = e.target.value ? Number(e.target.value) : undefined;
                            const asset = audioAssets.find((item) => item.id === assetId);
                            setMelodyDraft((prev) => ({
                              ...prev,
                              audio_asset_id: assetId,
                              bpm: asset?.tempo_bpm ?? prev.bpm,
                            }));
                          }}
                          className="input cursor-pointer"
                        >
                          <option value="">-- Không dùng file audio --</option>
                          {audioAssets.map((asset) => (
                            <option key={asset.id} value={asset.id}>
                              Asset #{asset.id}{asset.tempo_bpm ? ` · ${asset.tempo_bpm} bpm` : ''}{asset.duration_sec ? ` · ${asset.duration_sec}s` : ''}
                            </option>
                          ))}
                        </select>
                        {audioAssets.length === 0 && (
                          <span className="mt-2 block text-xs text-on-surface-variant">Chưa có file audio nào cho bài học này. Không bắt buộc — học viên vẫn chơi được theo nốt trên khuông nhạc. Nếu muốn phát giai điệu thật, hãy tải audio lên trong mục đa phương tiện của bài giảng.</span>
                        )}
                      </Field>

                      <Field label="Dãy giai điệu (các nốt, phân cách bằng khoảng trắng)">
                        <input
                          value={melodyInput}
                          list="minigame-note-suggestions"
                          onChange={(e) => {
                            const rawVal = e.target.value;
                            setMelodyInput(rawVal);
                            const nextMelody = rawVal.split(/\s+/).filter(Boolean);
                            setMelodyDraft((prev) => ({
                              ...prev,
                              melody: nextMelody,
                              missing_positions: prev.missing_positions.filter((p) => p <= nextMelody.length),
                            }));
                          }}
                          placeholder="Ví dụ: C4 E4 G4 C5 G4 E4"
                          className="input font-mono"
                        />
                        <span className="mt-2 block text-xs text-on-surface-variant">Nhấn vào từng nốt bên dưới để chọn vị trí khuyết (sẽ hiển thị dấu ? cho học viên).</span>
                      </Field>

                      {melodyDraft.melody.length > 0 && (
                        <div className="flex flex-wrap items-center gap-2">
                          {melodyDraft.melody.map((note, index) => {
                            const position = index + 1;
                            const missing = melodyDraft.missing_positions.includes(position);
                            return (
                              <button
                                key={position}
                                type="button"
                                onClick={() => {
                                  setMelodyDraft((prev) => ({
                                    ...prev,
                                    missing_positions: missing
                                      ? prev.missing_positions.filter((p) => p !== position)
                                      : [...prev.missing_positions, position].sort((a, b) => a - b),
                                  }));
                                }}
                                title={missing ? 'Bỏ đánh dấu khuyết' : 'Đánh dấu nốt này bị khuyết'}
                                className={`h-10 min-w-10 px-2 rounded-lg border text-sm font-bold transition-all duration-200 active:scale-95 ${
                                  missing
                                    ? 'border-dashed border-[#b45309] bg-amber-50 text-amber-800'
                                    : 'border-[#1D4532]/25 bg-[#1D4532]/5 text-[#1D4532] hover:bg-[#1D4532]/10'
                                }`}
                              >
                                {missing ? '?' : note}
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {melodyDraft.missing_positions.length > 0 && (
                        <div className="space-y-4">
                          {melodyDraft.missing_positions.map((position) => {
                            const options = melodyDraft.note_options[String(position)] ?? ['', '', '', ''];
                            const correct = melodyDraft.correct_answers[String(position)] ?? '';
                            return (
                              <div key={position} className="rounded-xl border border-amber-200 bg-amber-50/60 p-3.5">
                                <p className="mb-2.5 text-xs font-bold uppercase tracking-wider text-amber-900">
                                  Nốt khuyết tại vị trí <span className="tabular-nums">{position}</span>
                                </p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                  {options.map((option, optionIndex) => {
                                    const isCorrect = correct === option.trim();
                                    return (
                                      <div key={optionIndex} className={`flex items-center gap-2 rounded-lg border bg-white px-2.5 py-2 transition-colors ${isCorrect ? 'border-[#1D4532]/50 ring-1 ring-[#1D4532]/20' : 'border-outline-variant/30'}`}>
                                        <label
                                          className={`flex h-5 w-5 shrink-0 cursor-pointer items-center justify-center rounded-full border-2 transition-all duration-200 ${
                                            isCorrect
                                              ? 'border-[#1D4532] bg-[#1D4532] text-white'
                                              : 'border-outline-variant/60 text-transparent hover:border-[#1D4532]/50'
                                          }`}
                                          title="Đánh dấu là đáp án đúng"
                                        >
                                          <input
                                            type="radio"
                                            name={`correct-${position}`}
                                            className="sr-only"
                                            checked={isCorrect}
                                            onChange={() => {
                                              setMelodyDraft((prev) => ({
                                                ...prev,
                                                correct_answers: { ...prev.correct_answers, [String(position)]: option.trim() },
                                              }));
                                            }}
                                          />
                                          <Check className="h-3 w-3" strokeWidth={3} aria-hidden />
                                        </label>
                                        <input
                                          value={option}
                                          list="minigame-note-suggestions"
                                          onChange={(e) => {
                                            const newValue = e.target.value;
                                            setMelodyDraft((prev) => {
                                              const nextOptions = [...(prev.note_options[String(position)] ?? ['', '', '', ''])];
                                              const oldValue = nextOptions[optionIndex];
                                              nextOptions[optionIndex] = newValue;

                                              const nextCorrectAnswers = { ...prev.correct_answers };
                                              if (prev.correct_answers[String(position)]?.trim() === oldValue?.trim()) {
                                                nextCorrectAnswers[String(position)] = newValue.trim();
                                              }

                                              return {
                                                ...prev,
                                                note_options: { ...prev.note_options, [String(position)]: nextOptions },
                                                correct_answers: nextCorrectAnswers,
                                              };
                                            });
                                          }}
                                          placeholder={`Lựa chọn ${optionIndex + 1} (vd: C5)`}
                                          className="min-w-0 flex-1 rounded-md border border-transparent bg-transparent px-1 py-1 text-sm outline-none focus:border-[#1D4532]/30 focus:bg-[#fbf9f4]/80"
                                        />
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-4">
                        <Field label="Tempo (bpm)"><input type="number" min="1" required value={melodyDraft.bpm ?? ''} onChange={(e) => setMelodyDraft((prev) => ({ ...prev, bpm: e.target.value ? Number(e.target.value) : undefined }))} className="input" /></Field>
                        <Field label="Thời gian giới hạn (giây)"><input type="number" min="1" required value={melodyDraft.time_limit_sec ?? ''} onChange={(e) => setMelodyDraft((prev) => ({ ...prev, time_limit_sec: e.target.value ? Number(e.target.value) : undefined }))} className="input" /></Field>
                      </div>

                            <div>
                              <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-[#1D4532]">Xem trước</p>
                              <div className="flex items-center gap-1.5 overflow-x-auto rounded-xl border border-[#1D4532]/10 bg-white px-3 py-3">
                                <AudioLines className="mr-1 h-4 w-4 shrink-0 text-[#1D4532]/60" />
                                {melodyDraft.melody.map((note, index) => {
                                  const position = index + 1;
                                  return melodyDraft.missing_positions.includes(position) ? (
                                    <span key={position} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border-2 border-dashed border-amber-400 bg-amber-50 text-xs font-bold text-amber-700">?</span>
                                  ) : (
                                    <span key={position} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[#1D4532] text-[11px] font-bold text-white">{note}</span>
                                  );
                                })}
                                {melodyDraft.melody.length === 0 && <span className="text-xs text-on-surface-variant">Chưa có nốt — nhập dãy giai điệu ở trên.</span>}
                              </div>
                            </div>
                          </section>
                  </>}
                  {tab === 'minigames' && (
                    <datalist id="minigame-note-suggestions">
                      {['C1','D1','E1','F1','G1','A1','B1','C2','D2','E2','F2','G2','A2','B2','C3','D3','E3','F3','G3','A3','B3','C4','D4','E4','F4','G4','A4','B4','C5','D5','E5','F5','G5','A5','B5','C6'].map((note) => (
                        <option key={note} value={note} />
                      ))}
                    </datalist>
                  )}
                  <button disabled={saving} className="w-full bg-[#1D4532] text-white rounded-xl py-3.5 font-bold transition-all duration-200 hover:bg-[#1D4532]/90 active:scale-[0.99] disabled:opacity-60">{saving ? 'Đang lưu...' : editingId ? 'Lưu thay đổi' : 'Tạo nội dung'}</button>
                </form>
              </>
            )}
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
