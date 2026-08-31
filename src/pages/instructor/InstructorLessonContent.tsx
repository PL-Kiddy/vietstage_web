import { useCallback, useEffect, useState, type FormEvent, type ReactNode } from 'react';
import {
  ArrowLeft,
  AudioLines,
  Check,
  ClipboardList,
  Gamepad2,
  GraduationCap,
  HelpCircle,
  Music4,
  Pencil,
  Plus,
  Sparkles,
  Timer,
  Trash2,
  X,
  Volume2,
  Flame,
} from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { lessonDetailApi } from '../../api/management';
import { lessonAssetsApi } from '../../api/services';
import type { LessonAsset } from '../../api/types';
import {
  exercisesApi,
  minigamesApi,
  quizzesApi,
  MELODY_COMPLETE_CONFIG,
  RHYTHM_MATCH_CONFIG,
  type Exercise,
  type ExerciseInput,
  type MelodyCompleteConfig,
  type RhythmMatchConfig,
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
      return 'Mini game 1 — Nhịp điệu';
    case 'MELODY_COMPLETE':
      return 'Mini game 2 — Hoàn thiện giai điệu';
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

// ── Parser & Validator cho Mini game 2 (MELODY_COMPLETE) ──
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
      referenceAudioUrl: raw.referenceAudioUrl ? String(raw.referenceAudioUrl) : undefined,
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
    referenceAudioUrl: config.referenceAudioUrl,
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
  if (config.missing_positions.length !== 1) return 'Vui lòng chọn đúng 1 vị trí nốt khuyết.';
  for (const position of config.missing_positions) {
    if (!Number.isInteger(position) || position < 0 || position >= notes.length) return 'Vị trí nốt khuyết không hợp lệ.';
    const options = (config.note_options[String(position)] ?? []).map((o) => o.trim()).filter(Boolean);
    if (options.length < 4) return `Vị trí nốt khuyết (nốt ${position + 1}): cần đủ 4 lựa chọn.`;
    if (new Set(options).size !== options.length) return `Vị trí nốt khuyết (nốt ${position + 1}): các lựa chọn không được trùng nhau.`;
    const correct = (config.correct_answers[String(position)] ?? '').trim();
    if (!correct || !options.includes(correct)) return `Vị trí nốt khuyết (nốt ${position + 1}): vui lòng chọn một đáp án đúng trong 4 lựa chọn.`;
  }
  if (!config.bpm || config.bpm <= 0) return 'Tempo (BPM) phải lớn hơn 0.';
  if (!config.time_limit_sec || config.time_limit_sec <= 0) return 'Thời gian giới hạn (giây) phải lớn hơn 0.';
  return null;
};

// ── Parser & Validator cho Mini game 1 (RHYTHM_MATCH) ──
const parseRhythmConfig = (contentJson?: string): RhythmMatchConfig => {
  const fallback: RhythmMatchConfig = {
    tempo_bpm: 100,
    beats: [1.0, 2.0, 3.0, 4.0],
    rounds: [],
  };
  if (!contentJson) return fallback;
  try {
    const raw = JSON.parse(contentJson) as Partial<RhythmMatchConfig> & { tempoBpm?: number };
    const beats = Array.isArray(raw.beats)
      ? raw.beats.map(Number).filter((n) => Number.isFinite(n) && n >= 0).sort((a, b) => a - b)
      : fallback.beats;
    const tempo_bpm = typeof raw.tempo_bpm === 'number' ? raw.tempo_bpm : typeof raw.tempoBpm === 'number' ? raw.tempoBpm : 100;
    const rounds = Array.isArray(raw.rounds)
      ? raw.rounds.map((r) => ({
          title: r.title ? String(r.title) : undefined,
          tempo_bpm: typeof r.tempo_bpm === 'number' ? r.tempo_bpm : undefined,
          beats: Array.isArray(r.beats) ? r.beats.map(Number).filter((n) => Number.isFinite(n) && n >= 0).sort((a, b) => a - b) : [],
        }))
      : [];
    return {
      audio_asset_id: typeof raw.audio_asset_id === 'number' ? raw.audio_asset_id : undefined,
      referenceAudioUrl: raw.referenceAudioUrl ? String(raw.referenceAudioUrl) : undefined,
      tempo_bpm: tempo_bpm > 0 ? tempo_bpm : 100,
      beats: beats.length > 0 ? beats : fallback.beats,
      rounds,
    };
  } catch {
    return fallback;
  }
};

const buildRhythmConfigJson = (config: RhythmMatchConfig): string =>
  JSON.stringify({
    audio_asset_id: config.audio_asset_id,
    referenceAudioUrl: config.referenceAudioUrl,
    tempo_bpm: config.tempo_bpm ?? 100,
    beats: config.beats,
    rounds: config.rounds && config.rounds.length > 0 ? config.rounds : undefined,
  });

const validateRhythmDraft = (config: RhythmMatchConfig): string | null => {
  if (!config.tempo_bpm || config.tempo_bpm <= 0) return 'Tempo (BPM) phải lớn hơn 0.';
  if (!config.beats || config.beats.length < 2) return 'Vui lòng thiết lập tối thiểu 2 mốc phách (giây) để tạo thành tiết tấu.';
  if (config.beats.length > 16) return `Khuyến nghị tối đa 16 phách cho mỗi thử thách (hiện có ${config.beats.length} phách).`;
  for (const beat of config.beats) {
    if (!Number.isFinite(beat) || beat < 0) return 'Các mốc phách phải là số không âm.';
  }
  const maxTime = Math.max(...config.beats, 0);
  if (maxTime > 30) return `Thời lượng thử thách không nên vượt quá 30 giây (mốc phách cuối hiện tại: ${maxTime}s).`;
  return null;
};

const emptyExercise: ExerciseInput = { title: '', description: '', passThreshold: 80, orderIndex: 1 };
const emptyMinigame: MinigameInput = {
  title: '',
  challengeType: 'RHYTHM_MATCH',
  difficulty: 'BEGINNER',
  maxScore: 100,
  orderIndex: 1,
  contentJson: '{}',
};

// Trang biên soạn nội dung bài giảng: 3 tab Bài tập / Quiz / Minigame với giao diện trực quan hoàn toàn
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

  // Drafts cho 2 loại minigame (không bắt người dùng gõ JSON)
  const [rhythmDraft, setRhythmDraft] = useState<RhythmMatchConfig>(RHYTHM_MATCH_CONFIG);
  const [rhythmBeatsInput, setRhythmBeatsInput] = useState('1.0 2.0 3.0 4.0');
  const [melodyDraft, setMelodyDraft] = useState<MelodyCompleteConfig>(MELODY_COMPLETE_CONFIG);
  const [melodyInput, setMelodyInput] = useState('');
  const [audioAssets, setAudioAssets] = useState<LessonAsset[]>([]);

  // Tải danh sách audio của bài học khi mở editor minigame hoặc quiz (dùng cho chọn file nhạc mẫu)
  useEffect(() => {
    if ((tab !== 'minigames' && tab !== 'quizzes') || !editorOpen) return;
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

  // Tải dữ liệu nội dung: lesson detail + quizzes + minigames + exercises
  const loadContent = useCallback(async () => {
    if (!Number.isFinite(lessonId)) return;
    setLoading(true);
    setError('');
    try {
      const [lessonData, quizData, minigameData] = await Promise.all([
        lessonDetailApi.get(lessonId),
        quizzesApi.list(lessonId),
        minigamesApi.list(lessonId),
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

  // Mở editor tạo mới theo tab
  const openCreate = () => {
    setEditingId(null);
    if (tab === 'exercises') {
      const beatMapAsset = lesson?.mediaAssets?.find((asset) => asset.assetType === 'BEAT_MAP');
      setExerciseForm({ ...emptyExercise, beatMapAssetId: beatMapAsset?.id, orderIndex: exercises.length + 1 });
    }
    if (tab === 'minigames') {
      setMinigameForm({
        ...emptyMinigame,
        title: '',
        challengeType: 'RHYTHM_MATCH',
        difficulty: 'BEGINNER',
        maxScore: 100,
        orderIndex: minigames.length + 1,
      });
      setRhythmDraft(RHYTHM_MATCH_CONFIG);
      setRhythmBeatsInput(RHYTHM_MATCH_CONFIG.beats.join(' '));
      setMelodyDraft(MELODY_COMPLETE_CONFIG);
      setMelodyInput('');
    }
    setEditorOpen(true);
  };

  const openExercise = (item: Exercise) => {
    setEditingId(item.id);
    setExerciseForm({
      title: item.title,
      description: item.description ?? '',
      beatMapAssetId: item.beatMapAssetId,
      passThreshold: item.passThreshold ?? 80,
      orderIndex: item.orderIndex,
    });
    setEditorOpen(true);
  };

  const openQuiz = (item: Quiz) => {
    setEditingId(item.id);
    setEditorOpen(true);
  };

  // Mở chỉnh sửa minigame: Tự động phát hiện đúng loại và mở đúng form trực quan
  const openMinigame = (item: Minigame) => {
    setEditingId(item.id);
    const isRhythm = item.challengeType === 'RHYTHM_MATCH';
    setMinigameForm({
      title: item.title,
      challengeType: isRhythm ? 'RHYTHM_MATCH' : 'MELODY_COMPLETE',
      difficulty: item.difficulty ?? 'BEGINNER',
      maxScore: item.maxScore,
      orderIndex: item.orderIndex,
      contentJson: item.contentJson ?? '{}',
    });

    if (isRhythm) {
      const config = parseRhythmConfig(item.contentJson);
      setRhythmDraft(config);
      setRhythmBeatsInput(config.beats.join(' '));
    } else {
      const config = parseMelodyConfig(item.contentJson);
      setMelodyDraft(config);
      setMelodyInput(config.melody.join(' '));
    }
    setEditorOpen(true);
  };

  // Submit chung: exercises -> POST/PUT /api/exercises, minigames -> validate & build JSON tương ứng
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
        if (minigameForm.challengeType === 'RHYTHM_MATCH') {
          const validationError = validateRhythmDraft(rhythmDraft);
          if (validationError) {
            setError(validationError);
            setSaving(false);
            return;
          }
          const body: MinigameInput = {
            ...minigameForm,
            title: minigameForm.title.trim(),
            challengeType: 'RHYTHM_MATCH',
            difficulty: minigameForm.difficulty || 'BEGINNER',
            maxScore: minigameForm.maxScore > 0 ? minigameForm.maxScore : 100,
            referenceAssetId: rhythmDraft.audio_asset_id,
            contentJson: buildRhythmConfigJson(rhythmDraft),
          };
          if (editingId) await minigamesApi.update(editingId, body);
          else await minigamesApi.create(lessonId, body);
        } else {
          const validationError = validateMelodyDraft(melodyDraft);
          if (validationError) {
            setError(validationError);
            setSaving(false);
            return;
          }
          const body: MinigameInput = {
            ...minigameForm,
            title: minigameForm.title.trim(),
            challengeType: 'MELODY_COMPLETE',
            difficulty: minigameForm.difficulty || 'BEGINNER',
            maxScore: minigameForm.maxScore > 0 ? minigameForm.maxScore : 100,
            referenceAssetId: melodyDraft.audio_asset_id,
            contentJson: buildMelodyConfigJson(melodyDraft),
          };
          if (editingId) await minigamesApi.update(editingId, body);
          else await minigamesApi.create(lessonId, body);
        }
      }
      setEditorOpen(false);
      await loadContent();
    } catch (cause) {
      setError(cause instanceof SyntaxError ? 'Cấu hình dữ liệu của minigame không hợp lệ.' : cause instanceof Error ? cause.message : 'Không thể lưu nội dung.');
    } finally {
      setSaving(false);
    }
  };

  // Submit quiz qua QuizEditor
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

  // Xóa nội dung theo tab hiện tại
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
      <button
        onClick={onEdit}
        className="p-2 rounded-lg border border-outline-variant/20 text-[#1D4532] hover:bg-[#1D4532]/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4532]/30 transition-all duration-200 active:scale-90"
        title="Chỉnh sửa"
      >
        <Pencil className="w-4 h-4" />
      </button>
      <button
        onClick={() => void remove(id)}
        className="p-2 rounded-lg border border-red-200 text-red-700 hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-200 transition-all duration-200 active:scale-90"
        title="Xóa"
      >
        <Trash2 className="w-4 h-4" />
      </button>
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
        <p className="mt-1.5 text-white/70 max-w-2xl text-xs md:text-sm">
          Xây dựng bài tập thực hành, câu hỏi kiểm tra và các trò chơi tương tác (Nhịp điệu & Giai điệu) bằng giao diện trực quan.
        </p>
      </section>

      {error && <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-red-800">{error}</div>}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
        <div className="flex gap-2 bg-white p-1.5 rounded-xl border border-outline-variant/10 shadow-sm overflow-x-auto">
          {tabs.map(({ id, label, count, icon: Icon }) => (
            <button
              key={id}
              onClick={() => {
                setTab(id);
                setEditorOpen(false);
              }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-semibold whitespace-nowrap transition-colors ${
                tab === id ? 'bg-[#1D4532] text-white' : 'text-on-surface-variant hover:bg-[#f5f3ee]'
              }`}
            >
              <Icon className="w-4 h-4" /> {label} <span className={`text-xs px-2 py-0.5 rounded-full ${tab === id ? 'bg-white/20' : 'bg-[#eae8e3]'}`}>{count}</span>
            </button>
          ))}
        </div>
        <button onClick={openCreate} className="inline-flex justify-center items-center gap-2 bg-[#1D4532] text-white px-5 py-3 rounded-xl font-bold shadow-md hover:opacity-90 transition-all">
          <Plus className="w-5 h-5" /> Thêm {tabs.find((item) => item.id === tab)?.label.toLowerCase()}
        </button>
      </div>

      <section className="bg-white rounded-2xl border border-outline-variant/10 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-on-surface-variant">Đang tải nội dung...</div>
        ) : (
          <div className="divide-y divide-outline-variant/10">
            {tab === 'exercises' &&
              exercises.map((item) => (
                <article key={item.id} className="p-5 flex items-start justify-between gap-4 hover:bg-[#fbf9f4]">
                  <div>
                    <p className="text-xs text-[#1D4532] font-bold mb-1">BÀI TẬP #{item.orderIndex}</p>
                    <h3 className="font-bold text-lg">{item.title}</h3>
                    <p className="text-sm text-on-surface-variant mt-1">{item.description || 'Chưa có mô tả'} · Ngưỡng đạt {item.passThreshold ?? 0}%</p>
                  </div>
                  {itemActions(item.id, () => openExercise(item))}
                </article>
              ))}

            {tab === 'quizzes' &&
              quizzes.map((item) => (
                <article key={item.id} className="p-5 flex items-start justify-between gap-4 hover:bg-[#fbf9f4] transition-colors duration-200">
                  <div className="min-w-0">
                    <p className="text-[11px] uppercase tracking-[0.18em] font-bold text-[#1D4532]/70 mb-1.5">
                      Câu hỏi <span className="tabular-nums">#{item.orderIndex}</span> · {getQuestionTypeLabel(item.questionType)}
                    </p>
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
                          <span
                            key={`${option}-${index}`}
                            className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full transition-colors duration-200 ${
                              isCorrect ? 'bg-[#1D4532] text-white shadow-sm shadow-[#1D4532]/20' : 'bg-[#f0eee9] text-on-surface-variant'
                            }`}
                          >
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

            {tab === 'minigames' &&
              minigames.map((item) => {
                const isRhythm = item.challengeType === 'RHYTHM_MATCH';
                const rhythmConfig = isRhythm ? parseRhythmConfig(item.contentJson) : null;
                const melodyConfig = !isRhythm ? parseMelodyConfig(item.contentJson) : null;

                const difficultyClass =
                  item.difficulty === 'BEGINNER'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : item.difficulty === 'INTERMEDIATE'
                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                    : item.difficulty === 'ADVANCED'
                    ? 'bg-red-50 text-red-700 border-red-200'
                    : 'bg-[#f0eee9] text-on-surface-variant';

                return (
                  <article key={item.id} className="p-5 flex items-start justify-between gap-4 hover:bg-[#fbf9f4] transition-colors">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1.5">
                        <span
                          className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-md ${
                            isRhythm ? 'bg-emerald-100/70 text-emerald-900' : 'bg-purple-100/70 text-purple-900'
                          }`}
                        >
                          {isRhythm ? <Timer className="w-3.5 h-3.5 text-emerald-700" /> : <Music4 className="w-3.5 h-3.5 text-purple-700" />}
                          {getChallengeTypeLabel(item.challengeType)}
                        </span>
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${difficultyClass}`}>
                          {getDifficultyLabel(item.difficulty)}
                        </span>
                      </div>
                      <h3 className="font-bold text-lg">{item.title}</h3>
                      <p className="text-sm text-on-surface-variant mt-0.5">
                        Điểm tối đa: <strong className="text-neutral-800">{item.maxScore}</strong> · Thứ tự: #{item.orderIndex}
                      </p>

                      {isRhythm && rhythmConfig && (
                        <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-on-surface-variant">
                          <span className="inline-flex items-center gap-1 font-medium bg-emerald-50 px-2 py-1 rounded text-emerald-800">
                            <Flame className="w-3.5 h-3.5" /> Tempo: {rhythmConfig.tempo_bpm} BPM
                          </span>
                          <span className="inline-flex items-center gap-1 bg-neutral-100 px-2 py-1 rounded text-neutral-700">
                            <Timer className="w-3.5 h-3.5" /> {rhythmConfig.beats.length} phách ({rhythmConfig.beats.map((b) => `${b}s`).join(', ')})
                          </span>
                          {rhythmConfig.audio_asset_id && (
                            <span className="inline-flex items-center gap-1 bg-blue-50 px-2 py-1 rounded text-blue-800">
                              <Volume2 className="w-3.5 h-3.5" /> Audio #{rhythmConfig.audio_asset_id}
                            </span>
                          )}
                        </div>
                      )}

                      {!isRhythm && melodyConfig && (
                        <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-on-surface-variant">
                          <span className="inline-flex items-center gap-1 font-medium bg-purple-50 px-2 py-1 rounded text-purple-800">
                            <Music4 className="w-3.5 h-3.5" /> {melodyConfig.melody.length} nốt · {melodyConfig.missing_positions.length} vị trí khuyết (nốt #{melodyConfig.missing_positions.map((p) => p + 1).join(', ')})
                          </span>
                          {melodyConfig.bpm && (
                            <span className="inline-flex items-center gap-1 bg-neutral-100 px-2 py-1 rounded text-neutral-700">
                              <Flame className="w-3.5 h-3.5" /> {melodyConfig.bpm} BPM
                            </span>
                          )}
                          {melodyConfig.time_limit_sec && (
                            <span className="inline-flex items-center gap-1 bg-amber-50 px-2 py-1 rounded text-amber-800">
                              <Timer className="w-3.5 h-3.5" /> {melodyConfig.time_limit_sec}s
                            </span>
                          )}
                          {melodyConfig.audio_asset_id && (
                            <span className="inline-flex items-center gap-1 bg-blue-50 px-2 py-1 rounded text-blue-800">
                              <Volume2 className="w-3.5 h-3.5" /> Audio #{melodyConfig.audio_asset_id}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    {itemActions(item.id, () => openMinigame(item))}
                  </article>
                );
              })}

            {((tab === 'exercises' && exercises.length === 0) ||
              (tab === 'quizzes' && quizzes.length === 0) ||
              (tab === 'minigames' && minigames.length === 0)) && (
              <div className="p-14 text-center">
                <p className="font-bold text-lg">Chưa có nội dung</p>
                <p className="text-on-surface-variant mt-1">Bắt đầu bằng nút thêm nội dung phía trên.</p>
              </div>
            )}
          </div>
        )}
      </section>

      {editorOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex justify-end animate-[fadeIn_0.25s_ease-out]" onMouseDown={() => setEditorOpen(false)}>
          <div className="w-full max-w-xl h-full bg-white p-6 md:p-8 overflow-y-auto shadow-2xl custom-scrollbar animate-[slideIn_0.32s_cubic-bezier(0.22,1,0.36,1)]" onMouseDown={(event) => event.stopPropagation()}>
            <div className="flex justify-between items-start mb-6">
              <div>
                <p className="text-xs tracking-widest text-[#1D4532] font-bold uppercase">{editingId ? 'Chỉnh sửa' : 'Tạo mới'}</p>
                <h2 className="text-2xl font-bold mt-1">{tabs.find((item) => item.id === tab)?.label}</h2>
              </div>
              <button onClick={() => setEditorOpen(false)} className="p-2 rounded-full hover:bg-[#f0eee9] transition-colors duration-200 active:scale-90">
                <X className="w-5 h-5" />
              </button>
            </div>

            {tab === 'quizzes' ? (
              <QuizEditor
                initial={editingId ? quizzes.find((item) => item.id === editingId) ?? null : null}
                defaultOrderIndex={quizzes.length + 1}
                audioAssets={audioAssets}
                saving={saving}
                apiError={error}
                onCancel={() => setEditorOpen(false)}
                onSubmit={(body) => void submitQuiz(body)}
              />
            ) : (
              <>
                {error && <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 font-medium">{error}</div>}

                <form onSubmit={(event) => void submit(event)} className="space-y-5">
                  {tab === 'exercises' && (
                    <>
                      <Field label="Tên bài tập">
                        <input required value={exerciseForm.title} onChange={(e) => setExerciseForm({ ...exerciseForm, title: e.target.value })} className="input" />
                      </Field>
                      <Field label="Mô tả">
                        <textarea value={exerciseForm.description} onChange={(e) => setExerciseForm({ ...exerciseForm, description: e.target.value })} className="input min-h-28" />
                      </Field>
                      <div className="grid grid-cols-2 gap-4">
                        <Field label="Ngưỡng đạt (%)">
                          <input type="number" min="0" max="100" required value={exerciseForm.passThreshold} onChange={(e) => setExerciseForm({ ...exerciseForm, passThreshold: Number(e.target.value) })} className="input" />
                        </Field>
                        <Field label="Thứ tự">
                          <input type="number" min="0" required value={exerciseForm.orderIndex} onChange={(e) => setExerciseForm({ ...exerciseForm, orderIndex: Number(e.target.value) })} className="input" />
                        </Field>
                      </div>
                      <Field label={`Mã tài nguyên bản đồ nhịp điệu (Beat Map Asset ID)${editingId ? ' (không bắt buộc khi cập nhật)' : ''}`}>
                        <input
                          type="number"
                          min="1"
                          required={!editingId}
                          value={exerciseForm.beatMapAssetId ?? ''}
                          onChange={(e) => setExerciseForm({ ...exerciseForm, beatMapAssetId: e.target.value ? Number(e.target.value) : undefined })}
                          placeholder="Nhập ID tài nguyên BEAT_MAP"
                          className="input"
                        />
                        <span className="mt-2 block text-xs text-on-surface-variant">Hệ thống cần một tài nguyên đa phương tiện hợp lệ để liên kết với bài tập mới.</span>
                      </Field>
                    </>
                  )}

                  {tab === 'minigames' && (
                    <>
                      {/* BỘ CHỌN LOẠI MINIGAME TRỰC QUAN */}
                      <div>
                        <span className="block text-sm font-semibold mb-2 text-on-surface-variant">Chọn loại Minigame</span>
                        <div className="grid grid-cols-2 gap-3">
                          <button
                            type="button"
                            onClick={() => {
                              setMinigameForm((prev) => ({
                                ...prev,
                                challengeType: 'RHYTHM_MATCH',
                              }));
                            }}
                            className={`flex flex-col items-start p-3.5 rounded-xl border-2 text-left transition-all ${
                              minigameForm.challengeType === 'RHYTHM_MATCH'
                                ? 'border-[#1D4532] bg-[#1D4532]/5 text-[#1D4532] shadow-sm'
                                : 'border-outline-variant/30 hover:border-[#1D4532]/40 text-neutral-600'
                            }`}
                          >
                            <div className="flex items-center gap-2 font-bold text-sm">
                              <Timer className="w-4 h-4 text-[#1D4532]" />
                              Mini game 1
                            </div>
                            <p className="text-xs font-semibold mt-1">Gõ theo nhịp</p>
                            <p className="text-[11px] text-on-surface-variant mt-0.5">Luyện gõ đúng mốc phách theo BPM</p>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setMinigameForm((prev) => ({
                                ...prev,
                                challengeType: 'MELODY_COMPLETE',
                              }));
                            }}
                            className={`flex flex-col items-start p-3.5 rounded-xl border-2 text-left transition-all ${
                              minigameForm.challengeType === 'MELODY_COMPLETE'
                                ? 'border-[#6b21a8] bg-[#6b21a8]/5 text-[#6b21a8] shadow-sm'
                                : 'border-outline-variant/30 hover:border-[#6b21a8]/40 text-neutral-600'
                            }`}
                          >
                            <div className="flex items-center gap-2 font-bold text-sm">
                              <Music4 className="w-4 h-4 text-[#6b21a8]" />
                              Mini game 2
                            </div>
                            <p className="text-xs font-semibold mt-1">Hoàn thiện giai điệu</p>
                            <p className="text-[11px] text-on-surface-variant mt-0.5">Tìm nốt nhạc còn khuyết trong câu</p>
                          </button>
                        </div>
                      </div>

                      {/* CÁC TRƯỜNG CHUNG */}
                      <Field label="Tên minigame">
                        <input
                          required
                          value={minigameForm.title}
                          onChange={(e) => setMinigameForm({ ...minigameForm, title: e.target.value })}
                          className="input"
                          placeholder={minigameForm.challengeType === 'RHYTHM_MATCH' ? 'Ví dụ: Gõ nhịp 4/4 bài Trống Cơm' : 'Ví dụ: Điền nốt khuyết — Lý Cây Đa'}
                        />
                      </Field>

                      <div className="grid grid-cols-3 gap-3">
                        <Field label="Độ khó">
                          <select
                            value={minigameForm.difficulty ?? 'BEGINNER'}
                            onChange={(e) => setMinigameForm({ ...minigameForm, difficulty: e.target.value })}
                            className="input cursor-pointer"
                          >
                            <option value="BEGINNER">Cơ bản</option>
                            <option value="INTERMEDIATE">Trung cấp</option>
                            <option value="ADVANCED">Nâng cao</option>
                          </select>
                        </Field>
                        <Field label="Điểm tối đa">
                          <input
                            type="number"
                            min="10"
                            step="10"
                            required
                            value={minigameForm.maxScore}
                            onChange={(e) => setMinigameForm({ ...minigameForm, maxScore: Number(e.target.value) })}
                            className="input"
                          />
                        </Field>
                        <Field label="Thứ tự">
                          <input
                            type="number"
                            min="1"
                            required
                            value={minigameForm.orderIndex}
                            onChange={(e) => setMinigameForm({ ...minigameForm, orderIndex: Number(e.target.value) })}
                            className="input"
                          />
                        </Field>
                      </div>

                      {/* FORM 1: THỬ THÁCH NHỊP ĐIỆU (RHYTHM_MATCH) */}
                      {minigameForm.challengeType === 'RHYTHM_MATCH' && (
                        <section className="rounded-2xl border border-[#1D4532]/20 bg-[#fbf9f4] p-4.5 space-y-5">
                          <div className="flex items-center justify-between">
                            <p className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.18em] text-[#1D4532]">
                              <Sparkles className="w-3.5 h-3.5" /> Thiết lập phách nhịp
                            </p>
                            <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded">RHYTHM_MATCH</span>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <Field label="Tempo (BPM - Nhịp/phút)">
                              <input
                                type="number"
                                min="30"
                                max="300"
                                required
                                value={rhythmDraft.tempo_bpm ?? 100}
                                onChange={(e) => setRhythmDraft((prev) => ({ ...prev, tempo_bpm: Number(e.target.value) || 100 }))}
                                className="input font-semibold"
                              />
                              <span className="mt-1 block text-[11px] text-on-surface-variant">Tốc độ tiếng gõ metronome đếm nhịp cho học viên.</span>
                            </Field>
                            <Field label="Thời lượng ước tính (Tự động)">
                              <input
                                disabled
                                value={rhythmDraft.beats.length > 0 ? `~ ${(Math.max(...rhythmDraft.beats, 0) + 1.0).toFixed(1)} giây` : '0 giây'}
                                className="input bg-neutral-100 text-neutral-600 font-medium"
                              />
                              <span className="mt-1 block text-[11px] text-on-surface-variant">Tự tính từ mốc phách cuối + 1 giây chuẩn bị.</span>
                            </Field>
                          </div>

                          <Field label="Danh sách mốc phách (giây)">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs text-on-surface-variant">Phân cách bằng khoảng trắng hoặc dấu phẩy</span>
                              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                                rhythmDraft.beats.length > 16
                                  ? 'bg-red-100 text-red-700'
                                  : rhythmDraft.beats.length >= 2
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-neutral-100 text-neutral-600'
                              }`}>
                                {rhythmDraft.beats.length} / 16 phách tối đa
                              </span>
                            </div>
                            <input
                              value={rhythmBeatsInput}
                              onChange={(e) => {
                                const val = e.target.value;
                                setRhythmBeatsInput(val);
                                const parsedBeats = val
                                  .split(/[\s,]+/)
                                  .map((s) => parseFloat(s.trim()))
                                  .filter((n) => !isNaN(n) && n >= 0)
                                  .sort((a, b) => a - b);
                                setRhythmDraft((prev) => ({ ...prev, beats: parsedBeats }));
                              }}
                              placeholder="Ví dụ: 1.0 2.0 3.0 4.0"
                              className="input font-mono"
                            />
                            {rhythmDraft.beats.length > 16 && (
                              <p className="mt-1.5 text-xs text-red-600 font-medium">
                                * Số lượng phách quá dài ({rhythmDraft.beats.length} phách). Khuyến nghị tối đa 16 phách (khoảng 5-15s) để học viên kịp nhìn và thao tác trên điện thoại.
                              </p>
                            )}
                            <div className="mt-2.5 flex flex-wrap gap-2 items-center">
                              <button
                                type="button"
                                disabled={rhythmDraft.beats.length >= 16}
                                onClick={() => {
                                  const last = rhythmDraft.beats.length > 0 ? rhythmDraft.beats[rhythmDraft.beats.length - 1] : 0;
                                  const next = Number((last + 1.0).toFixed(2));
                                  const nextBeats = [...rhythmDraft.beats, next];
                                  setRhythmDraft((prev) => ({ ...prev, beats: nextBeats }));
                                  setRhythmBeatsInput(nextBeats.join(' '));
                                }}
                                className="text-xs bg-emerald-50 hover:bg-emerald-100 disabled:opacity-40 disabled:hover:bg-emerald-50 text-emerald-800 px-2.5 py-1.5 rounded-md font-medium border border-emerald-200 transition-colors"
                              >
                                + Thêm 1 phách (+1.0s)
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  const preset = [1.0, 2.0, 3.0, 4.0];
                                  setRhythmDraft((prev) => ({ ...prev, beats: preset }));
                                  setRhythmBeatsInput(preset.join(' '));
                                }}
                                className="text-xs bg-neutral-100 hover:bg-neutral-200 text-neutral-700 px-2.5 py-1.5 rounded-md font-medium transition-colors"
                              >
                                Mẫu: 4 phách đều
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  const preset = [0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0];
                                  setRhythmDraft((prev) => ({ ...prev, beats: preset }));
                                  setRhythmBeatsInput(preset.join(' '));
                                }}
                                className="text-xs bg-neutral-100 hover:bg-neutral-200 text-neutral-700 px-2.5 py-1.5 rounded-md font-medium transition-colors"
                              >
                                Mẫu: 8 phách nhanh
                              </button>
                              {rhythmDraft.beats.length > 0 && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setRhythmDraft((prev) => ({ ...prev, beats: [] }));
                                    setRhythmBeatsInput('');
                                  }}
                                  className="text-xs text-red-600 hover:text-red-800 px-2 py-1 font-medium ml-auto"
                                >
                                  Xóa hết
                                </button>
                              )}
                            </div>
                          </Field>

                          {/* TÙY CHỌN NÂNG CAO CHO AUDIO */}
                          <details className="group rounded-xl border border-dashed border-[#1D4532]/25 bg-white/60 p-3.5 transition-all">
                            <summary className="flex cursor-pointer items-center justify-between text-xs font-bold text-[#1D4532] select-none">
                              <span>⚙️ Tùy chọn nâng cao: File audio nhạc đệm (không bắt buộc)</span>
                              <span className="text-neutral-400 group-open:rotate-180 transition-transform">▼</span>
                            </summary>
                            <div className="mt-3 pt-3 border-t border-outline-variant/15 space-y-2">
                              <select
                                value={rhythmDraft.audio_asset_id ?? ''}
                                onChange={(e) => {
                                  const assetId = e.target.value ? Number(e.target.value) : undefined;
                                  const asset = audioAssets.find((item) => item.id === assetId);
                                  setRhythmDraft((prev) => ({
                                    ...prev,
                                    audio_asset_id: assetId,
                                    referenceAudioUrl: asset?.url,
                                    tempo_bpm: asset?.tempo_bpm ?? prev.tempo_bpm,
                                  }));
                                }}
                                className="input cursor-pointer"
                              >
                                <option value="">-- Mặc định: Dùng tiếng gõ Metronome tự động của ứng dụng --</option>
                                {audioAssets.map((asset) => (
                                  <option key={asset.id} value={asset.id}>
                                    Asset #{asset.id} · {asset.title || 'Audio tham chiếu'}{asset.tempo_bpm ? ` (${asset.tempo_bpm} BPM)` : ''}
                                  </option>
                                ))}
                              </select>
                              <span className="block text-[11px] text-on-surface-variant">
                                Ứng dụng Godot đã tích hợp sẵn máy đếm nhịp. Chỉ chọn file audio này nếu bạn muốn phát một đoạn nhạc nền riêng.
                              </span>
                            </div>
                          </details>

                          {/* TIMELINE PREVIEW CHO RHYTHM */}
                          <div>
                            <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-[#1D4532]">
                              Xem trước dòng thời gian nhịp ({rhythmDraft.beats.length} phách)
                            </p>
                            <div className="rounded-xl border border-[#1D4532]/15 bg-white p-3.5 space-y-2">
                              {rhythmDraft.beats.length === 0 ? (
                                <p className="text-xs text-on-surface-variant text-center py-2">Chưa có mốc phách nào — hãy nhập hoặc bấm mẫu phía trên.</p>
                              ) : (
                                <>
                                  <div className="relative h-9 bg-neutral-100 rounded-lg overflow-hidden flex items-center px-3 border border-neutral-200">
                                    <div className="absolute inset-x-0 h-0.5 bg-neutral-300" />
                                    {rhythmDraft.beats.map((beat, idx) => {
                                      const maxTime = Math.max(...rhythmDraft.beats, 1);
                                      const leftPercent = Math.min(95, Math.max(5, (beat / (maxTime + 0.8)) * 100));
                                      return (
                                        <div
                                          key={`${beat}-${idx}`}
                                          style={{ left: `${leftPercent}%` }}
                                          className="absolute -translate-x-1/2 flex flex-col items-center group cursor-pointer"
                                          title={`Phách #${idx + 1} tại ${beat}s (Bấm để xóa)`}
                                          onClick={() => {
                                            const filtered = rhythmDraft.beats.filter((_, i) => i !== idx);
                                            setRhythmDraft((prev) => ({ ...prev, beats: filtered }));
                                            setRhythmBeatsInput(filtered.join(' '));
                                          }}
                                        >
                                          <span className="w-4 h-4 rounded-full bg-[#1D4532] text-white text-[10px] font-bold flex items-center justify-center shadow-sm group-hover:bg-red-600 transition-colors">
                                            {idx + 1}
                                          </span>
                                        </div>
                                      );
                                    })}
                                  </div>
                                  <div className="flex flex-wrap gap-1.5 pt-1">
                                    {rhythmDraft.beats.map((beat, idx) => (
                                      <span
                                        key={idx}
                                        className="inline-flex items-center gap-1 text-xs bg-emerald-50 border border-emerald-200 text-emerald-900 px-2 py-0.5 rounded font-mono"
                                      >
                                        Phách {idx + 1}: <strong>{beat}s</strong>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            const filtered = rhythmDraft.beats.filter((_, i) => i !== idx);
                                            setRhythmDraft((prev) => ({ ...prev, beats: filtered }));
                                            setRhythmBeatsInput(filtered.join(' '));
                                          }}
                                          className="text-red-500 hover:text-red-700 font-bold ml-0.5"
                                          title="Xóa phách này"
                                        >
                                          ×
                                        </button>
                                      </span>
                                    ))}
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        </section>
                      )}

                      {/* FORM 2: HOÀN THIỆN GIAI ĐIỆU (MELODY_COMPLETE) */}
                      {minigameForm.challengeType === 'MELODY_COMPLETE' && (
                        <section className="rounded-2xl border border-purple-200 bg-[#fcfaff] p-4.5 space-y-5">
                          <div className="flex items-center justify-between">
                            <p className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.18em] text-[#6b21a8]">
                              <Sparkles className="w-3.5 h-3.5" /> Cấu hình giai điệu & Nốt khuyết
                            </p>
                            <span className="text-xs bg-purple-100 text-purple-800 font-bold px-2 py-0.5 rounded">MELODY_COMPLETE</span>
                          </div>

                          {/* DÃY GIAI ĐIỆU */}
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
                                  missing_positions: prev.missing_positions.filter((p) => p >= 0 && p < nextMelody.length),
                                }));
                              }}
                              placeholder="Ví dụ: C4 E4 G4 C5 G4 E4 hoặc Đô Rê Mi Sol La"
                              className="input font-mono"
                            />
                            <span className="mt-1.5 block text-xs text-on-surface-variant">Nhấn vào từng nốt bên dưới để chọn đúng 1 vị trí nốt khuyết (sẽ hiển thị dấu ? cho học viên).</span>
                          </Field>

                          {/* TÙY CHỌN NÂNG CAO CHO AUDIO GIAI ĐIỆU */}
                          <details className="group rounded-xl border border-dashed border-purple-300/50 bg-white/60 p-3.5 transition-all">
                            <summary className="flex cursor-pointer items-center justify-between text-xs font-bold text-[#6b21a8] select-none">
                              <span>⚙️ Tùy chọn nâng cao: File audio giai điệu (không bắt buộc)</span>
                              <span className="text-neutral-400 group-open:rotate-180 transition-transform">▼</span>
                            </summary>
                            <div className="mt-3 pt-3 border-t border-purple-100 space-y-2">
                              <select
                                value={melodyDraft.audio_asset_id ?? ''}
                                onChange={(e) => {
                                  const assetId = e.target.value ? Number(e.target.value) : undefined;
                                  const asset = audioAssets.find((item) => item.id === assetId);
                                  setMelodyDraft((prev) => ({
                                    ...prev,
                                    audio_asset_id: assetId,
                                    referenceAudioUrl: asset?.url,
                                    bpm: asset?.tempo_bpm ?? prev.bpm,
                                  }));
                                }}
                                className="input cursor-pointer"
                              >
                                <option value="">-- Mặc định: Dùng bộ phát âm thanh nốt nhạc tự động của ứng dụng --</option>
                                {audioAssets.map((asset) => (
                                  <option key={asset.id} value={asset.id}>
                                    Asset #{asset.id} · {asset.title || 'Audio'}{asset.tempo_bpm ? ` (${asset.tempo_bpm} BPM)` : ''}
                                  </option>
                                ))}
                              </select>
                              <span className="block text-[11px] text-on-surface-variant">
                                Ứng dụng Godot đã tích hợp sẵn âm thanh nốt nhạc chuẩn. Không bắt buộc phải tải lên file audio.
                              </span>
                            </div>
                          </details>

                          {melodyDraft.melody.length > 0 && (
                            <div>
                              <p className="mb-2 text-xs font-semibold text-neutral-700">Chọn vị trí nốt khuyết (Click vào nốt):</p>
                              <div className="flex flex-wrap items-center gap-2">
                                {melodyDraft.melody.map((note, index) => {
                                  const isMissing = melodyDraft.missing_positions.includes(index);
                                  return (
                                    <button
                                      key={index}
                                      type="button"
                                      onClick={() => {
                                        const nextMissing = isMissing ? [] : [index];
                                        const posKey = String(index);
                                        const currentOptions = melodyDraft.note_options[posKey] ?? ['', '', '', ''];
                                        const nextOptions = [...currentOptions];
                                        if (!isMissing && !nextOptions[0] && note) {
                                          nextOptions[0] = note;
                                        }
                                        setMelodyDraft((prev) => ({
                                          ...prev,
                                          missing_positions: nextMissing,
                                          note_options: !isMissing ? { ...prev.note_options, [posKey]: nextOptions } : prev.note_options,
                                          correct_answers: !isMissing && !prev.correct_answers[posKey] ? { ...prev.correct_answers, [posKey]: note } : prev.correct_answers,
                                        }));
                                      }}
                                      title={isMissing ? 'Bỏ đánh dấu khuyết' : `Đánh dấu nốt ${index + 1} (${note}) bị khuyết`}
                                      className={`h-11 min-w-11 px-3 rounded-lg border text-sm font-bold transition-all duration-200 active:scale-95 flex items-center justify-center gap-1 ${
                                        isMissing
                                          ? 'border-2 border-dashed border-[#b45309] bg-amber-100 text-amber-900 shadow-sm'
                                          : 'border-purple-200 bg-purple-50 text-purple-900 hover:bg-purple-100'
                                      }`}
                                    >
                                      {isMissing ? `? (${note})` : note}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {melodyDraft.missing_positions.length > 0 && (
                            <div className="space-y-4">
                              {melodyDraft.missing_positions.map((position) => {
                                const options = melodyDraft.note_options[String(position)] ?? ['', '', '', ''];
                                const correct = melodyDraft.correct_answers[String(position)] ?? '';
                                return (
                                  <div key={position} className="rounded-xl border border-amber-200 bg-amber-50/70 p-4">
                                    <p className="mb-2.5 text-xs font-bold uppercase tracking-wider text-amber-900">
                                      4 lựa chọn cho nốt khuyết tại vị trí <span className="tabular-nums font-extrabold text-sm text-[#1D4532]">#{position + 1}</span> (nốt gốc: {melodyDraft.melody[position]})
                                    </p>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                      {options.map((option, optionIndex) => {
                                        const isCorrect = correct === option.trim() && option.trim().length > 0;
                                        return (
                                          <div
                                            key={optionIndex}
                                            className={`flex items-center gap-2 rounded-lg border bg-white px-2.5 py-2 transition-colors ${
                                              isCorrect ? 'border-emerald-500 ring-2 ring-emerald-400/30' : 'border-outline-variant/30'
                                            }`}
                                          >
                                            <label
                                              className={`flex h-5 w-5 shrink-0 cursor-pointer items-center justify-center rounded-full border-2 transition-all duration-200 ${
                                                isCorrect
                                                  ? 'border-emerald-600 bg-emerald-600 text-white'
                                                  : 'border-outline-variant/60 text-transparent hover:border-emerald-500'
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
                                              placeholder={`Lựa chọn ${optionIndex + 1} (vd: C4)`}
                                              className="min-w-0 flex-1 rounded-md border border-transparent bg-transparent px-1 py-1 text-sm outline-none focus:border-purple-300 font-mono"
                                            />
                                          </div>
                                        );
                                      })}
                                    </div>
                                    <span className="mt-2 block text-xs text-amber-800">
                                      * Nhấp vào nút tròn bên cạnh lựa chọn để chọn đó là <strong>đáp án đúng</strong>.
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          <div className="grid grid-cols-2 gap-4">
                            <Field label="Tempo (BPM)">
                              <input
                                type="number"
                                min="30"
                                max="300"
                                required
                                value={melodyDraft.bpm ?? 80}
                                onChange={(e) => setMelodyDraft((prev) => ({ ...prev, bpm: e.target.value ? Number(e.target.value) : undefined }))}
                                className="input font-semibold"
                              />
                            </Field>
                            <Field label="Thời gian giới hạn (giây)">
                              <input
                                type="number"
                                min="5"
                                max="300"
                                required
                                value={melodyDraft.time_limit_sec ?? 30}
                                onChange={(e) => setMelodyDraft((prev) => ({ ...prev, time_limit_sec: e.target.value ? Number(e.target.value) : undefined }))}
                                className="input font-semibold"
                              />
                            </Field>
                          </div>

                          {/* MELODY PREVIEW: FIXED 0-BASED INDEX MATCH */}
                          <div>
                            <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-[#6b21a8]">Xem trước giao diện hiển thị cho học viên</p>
                            <div className="flex items-center gap-1.5 overflow-x-auto rounded-xl border border-purple-200 bg-white px-3 py-3">
                              <AudioLines className="mr-1 h-4 w-4 shrink-0 text-purple-600" />
                              {melodyDraft.melody.map((note, index) => {
                                const isMissing = melodyDraft.missing_positions.includes(index);
                                return isMissing ? (
                                  <span key={index} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border-2 border-dashed border-amber-500 bg-amber-100 text-xs font-extrabold text-amber-900 shadow-sm" title={`Nốt #${index + 1} bị khuyết`}>
                                    ?
                                  </span>
                                ) : (
                                  <span key={index} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[#6b21a8] text-[11px] font-bold text-white shadow-sm">
                                    {note}
                                  </span>
                                );
                              })}
                              {melodyDraft.melody.length === 0 && <span className="text-xs text-on-surface-variant">Chưa có nốt — hãy nhập dãy giai điệu ở ô phía trên.</span>}
                            </div>
                          </div>
                        </section>
                      )}
                    </>
                  )}

                  {tab === 'minigames' && (
                    <datalist id="minigame-note-suggestions">
                      {['C1', 'D1', 'E1', 'F1', 'G1', 'A1', 'B1', 'C2', 'D2', 'E2', 'F2', 'G2', 'A2', 'B2', 'C3', 'D3', 'E3', 'F3', 'G3', 'A3', 'B3', 'C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5', 'D5', 'E5', 'F5', 'G5', 'A5', 'B5', 'C6', 'Đô', 'Rê', 'Mi', 'Fa', 'Sol', 'La', 'Si'].map((note) => (
                        <option key={note} value={note} />
                      ))}
                    </datalist>
                  )}

                  <button disabled={saving} className="w-full bg-[#1D4532] text-white rounded-xl py-3.5 font-bold transition-all duration-200 hover:bg-[#1D4532]/90 active:scale-[0.99] disabled:opacity-60 shadow-md">
                    {saving ? 'Đang lưu...' : editingId ? 'Lưu thay đổi' : 'Tạo nội dung'}
                  </button>
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
  <label className="block">
    <span className="block text-sm font-semibold mb-2 text-on-surface-variant">{label}</span>
    {children}
  </label>
);

export default InstructorLessonContent;
