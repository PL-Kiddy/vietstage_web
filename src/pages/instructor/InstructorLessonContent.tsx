import { useCallback, useEffect, useState, type FormEvent, type ReactNode } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  ArrowDown,
  ArrowUp,
  AudioLines,
  Check,
  ClipboardList,
  Flame,
  Gamepad2,
  GraduationCap,
  HelpCircle,
  Music4,
  Pencil,
  Plus,
  Sparkles,
  Timer,
  Trash2,
  Volume2,
  X,
} from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { lessonDetailApi } from '../../api/management';
import { lessonAssetsApi } from '../../api/services';
import type { LessonAsset, Lesson } from '../../api/types';
import {
  exercisesApi,
  minigamesApi,
  quizzesApi,
  MELODY_COMPLETE_CONFIG,
  RHYTHM_MATCH_CONFIG,
  getMeasureDurationBeats,
  getTimeSignatureLabel,
  type Exercise,
  type ExerciseInput,
  type MelodyCompleteConfig,
  type RhythmMatchConfig,
  type RhythmRoundConfig,
  type TimeSignature,
  type Minigame,
  type MinigameInput,
  type Quiz,
  type QuizInput,
} from '../../api/lessonContent';
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

const INSTRUMENT_NOTES: Record<string, string[]> = {
  // Đàn tranh 17 dây, dây Bắc: Sol–La–Đô–Rê–Mi lặp lại theo 4 âm vực.
  // Chuỗi này đồng nhất với thứ tự dây 1 → 17 trong ứng dụng Godot.
  dan_tranh: ['Sol1', 'La1', 'Đô2', 'Rê2', 'Mi2', 'Sol2', 'La2', 'Đô3', 'Rê3', 'Mi3', 'Sol3', 'La3', 'Đô4', 'Rê4', 'Mi4', 'Sol4', 'La4'],
  // Chỉ hiển thị cao độ đã có WAV thu thật để nốt "Nghe mẫu" luôn phát được.
  dan_bau: ['C4', 'G4', 'C5', 'E5', 'G5', 'C6'],
  sao_truc: ['Đô', 'Rê', 'Mi', 'Fa', 'Sol', 'La', 'Si', 'Đố'],
  trong_chau: ['Tịch', 'Cắc'],
};

const normalizeInstrumentKey = (instrument?: { name?: string; instrumentCode?: string } | string | null): string => {
  if (!instrument) return 'dan_tranh';
  const text = typeof instrument === 'string' ? instrument.toLowerCase() : `${instrument.instrumentCode ?? ''} ${instrument.name ?? ''}`.toLowerCase();
  if (text.includes('tranh') || text.includes('dan_tranh')) return 'dan_tranh';
  if (text.includes('bau') || text.includes('bầu') || text.includes('dan_bau')) return 'dan_bau';
  if (text.includes('sao') || text.includes('sáo') || text.includes('sao_truc')) return 'sao_truc';
  if (text.includes('trong') || text.includes('trống') || text.includes('trong_chau')) return 'trong_chau';
  return 'dan_tranh';
};

const notesForInstrument = (instrument?: { name?: string; instrumentCode?: string } | string | null) =>
  INSTRUMENT_NOTES[normalizeInstrumentKey(instrument)] ?? INSTRUMENT_NOTES.dan_tranh;

const noteOptionLabel = (instrument: { name?: string; instrumentCode?: string } | string | null | undefined, note: string) => {
  if (normalizeInstrumentKey(instrument) !== 'dan_tranh') return note;
  const stringNumber = INSTRUMENT_NOTES.dan_tranh.indexOf(note) + 1;
  return stringNumber > 0 ? `Dây ${stringNumber} · ${note}` : note;
};

const newRhythmRound = (index: number, instrument?: { name?: string; instrumentCode?: string } | string | null): RhythmRoundConfig => {
  const notes = notesForInstrument(instrument);
  return {
    title: `Vòng ${index}`,
    tempo_bpm: 100,
    time_signature: [4, 4],
    beats: [],
    notes: [],
    events: [
      { note: notes[0], mode: 'SAMPLE', duration_beats: 1 },
      { note: notes[1] ?? notes[0], mode: 'SAMPLE', duration_beats: 1 },
      { note: notes[2] ?? notes[0], mode: 'TARGET', duration_beats: 1 },
      { note: notes[3] ?? notes[1] ?? notes[0], mode: 'TARGET', duration_beats: 1 },
    ],
  };
};

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
      missing_index: Number.isInteger(raw.missing_index)
        ? Number(raw.missing_index)
        : (Array.isArray(raw.missing_positions) ? Number(raw.missing_positions[0]) : undefined),
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
    missing_index: config.missing_index,
    bpm: config.bpm,
  });

const validateMelodyDraft = (config: MelodyCompleteConfig): string | null => {
  const notes = config.melody.map((n) => n.trim()).filter(Boolean);
  if (notes.length < 2) return 'Giai điệu cần tối thiểu 2 nốt.';
  if (!Number.isInteger(config.missing_index) || config.missing_index! < 0 || config.missing_index! >= notes.length) return 'Vui lòng chọn đúng một nốt khuyết.';
  if (!config.bpm || config.bpm <= 0) return 'Tempo (BPM) phải lớn hơn 0.';
  return null;
};

// ── Parser & Validator cho Mini game 1 (RHYTHM_MATCH) ──
const NOTE_DURATIONS = [
  { value: 4, label: 'Tròn · 4 phách' },
  { value: 2, label: 'Trắng · 2 phách' },
  { value: 1, label: 'Đen · 1 phách' },
  { value: 0.5, label: 'Móc đơn · ½ phách' },
  { value: 0.25, label: 'Móc đôi · ¼ phách' },
] as const;

const parseTimeSig = (rawSig: unknown): TimeSignature => {
  if (Array.isArray(rawSig) && rawSig.length >= 2) {
    const num = Number(rawSig[0]);
    const den = Number(rawSig[1]);
    if ((num === 2 && den === 4) || (num === 3 && den === 4) || (num === 4 && den === 4) || (num === 6 && den === 8)) {
      return [num, den];
    }
  }
  return [4, 4];
};

const legacyEvents = (round: Record<string, unknown>, bpm: number) => {
  const notes = Array.isArray(round.notes) ? round.notes.map(String) : [];
  const beats = Array.isArray(round.beats) ? round.beats.map(Number) : [];
  return notes.map((note, index) => {
    const current = beats[index] ?? index + 1;
    const next = beats[index + 1] ?? current + 60 / bpm;
    return { note: note.trim(), mode: 'TARGET' as const, duration_beats: Math.max(0.25, Number(((next - current) * bpm / 60).toFixed(2))) };
  });
};

const parseRhythmConfig = (contentJson?: string): RhythmMatchConfig => {
  if (!contentJson) return { beats: [], rounds: [] };
  try {
    const raw = JSON.parse(contentJson) as { rounds?: Array<Record<string, unknown>>; tempo_bpm?: number; tempoBpm?: number };
    const inheritedBpm = Number(raw.tempo_bpm ?? raw.tempoBpm ?? 100) || 100;
    return {
      rounds: Array.isArray(raw.rounds) ? raw.rounds.map((round, index) => {
        const bpm = Number(round.tempo_bpm ?? round.tempoBpm ?? inheritedBpm) || 100;
        const time_signature = parseTimeSig(round.time_signature ?? round.timeSignature);
        const events = Array.isArray(round.events)
          ? round.events.map((event) => {
              const item = event as Record<string, unknown>;
              return {
                note: String(item.note ?? '').trim(),
                mode: item.mode === 'SAMPLE' ? 'SAMPLE' as const : 'TARGET' as const,
                duration_beats: Number(item.duration_beats ?? 1),
              };
            })
          : legacyEvents(round, bpm);
        return { title: String(round.title ?? `Vòng ${index + 1}`), tempo_bpm: bpm, time_signature, events, beats: [], notes: [] };
      }) : [],
      beats: [],
    };
  } catch {
    return { beats: [], rounds: [] };
  }
};

const buildRhythmConfigJson = (config: RhythmMatchConfig): string => JSON.stringify({
  rounds: config.rounds.map((round) => {
    const msPerBeat = 60000 / round.tempo_bpm;
    let elapsed = 0;
    const events = round.events.map((event) => {
      const durationMs = Math.round(event.duration_beats * msPerBeat);
      const result = { ...event, at_ms: elapsed, duration_ms: durationMs };
      elapsed += durationMs;
      return result;
    });
    return {
      title: round.title,
      tempo_bpm: round.tempo_bpm,
      time_signature: round.time_signature ?? [4, 4],
      events,
    };
  }),
});

const validateRhythmDraft = (config: RhythmMatchConfig): string | null => {
  if (!config.rounds.length) return 'Vui lòng tạo ít nhất 1 vòng luyện.';
  for (let roundIndex = 0; roundIndex < config.rounds.length; roundIndex += 1) {
    const round = config.rounds[roundIndex];
    const label = `Vòng ${roundIndex + 1}`;
    const timeSig = round.time_signature ?? [4, 4];
    const measureDuration = getMeasureDurationBeats(timeSig);

    if (!Number.isFinite(round.tempo_bpm) || round.tempo_bpm < 30 || round.tempo_bpm > 300) {
      return `${label}: BPM phải từ 30 đến 300.`;
    }
    if (round.events.length < 2 || round.events.length > 32) {
      return `${label}: cần từ 2 đến 32 nốt.`;
    }
    if (!round.events.some((event) => event.mode === 'TARGET')) {
      return `${label}: cần ít nhất 1 nốt học viên chơi (Cần chơi).`;
    }

    let elapsedBeats = 0;
    for (let index = 0; index < round.events.length; index += 1) {
      const event = round.events[index];
      if (!event.note.trim()) return `${label}, nốt ${index + 1}: vui lòng chọn nốt.`;
      if (!NOTE_DURATIONS.some((duration) => duration.value === event.duration_beats)) {
        return `${label}, nốt ${index + 1}: trường độ không hợp lệ.`;
      }

      const currentMeasure = Math.floor(elapsedBeats / measureDuration + 0.0001) + 1;
      const beatInMeasure = elapsedBeats - (currentMeasure - 1) * measureDuration;

      if (beatInMeasure + event.duration_beats > measureDuration + 0.001) {
        return `${label}, nốt ${index + 1} (${event.note}, ${event.duration_beats} phách) vượt qua vạch nhịp của ô ${currentMeasure}. Vui lòng chỉnh trường độ để vừa khít ô nhịp ${timeSig[0]}/${timeSig[1]}.`;
      }

      elapsedBeats += event.duration_beats;
    }

    const remainder = elapsedBeats % measureDuration;
    if (Math.abs(remainder) > 0.001 && Math.abs(remainder - measureDuration) > 0.001) {
      const needed = Number((measureDuration - remainder).toFixed(2));
      const totalMeasures = Math.ceil(elapsedBeats / measureDuration);
      return `${label}: Tổng trường độ là ${elapsedBeats} phách, chưa khép kín ô nhịp ${timeSig[0]}/${timeSig[1]} (mỗi ô ${measureDuration} phách). Ô nhịp ${totalMeasures} còn thiếu ${needed} phách.`;
    }
  }
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
  const [melodyDraft, setMelodyDraft] = useState<MelodyCompleteConfig>(MELODY_COMPLETE_CONFIG);
  const [melodyMarkingMissing, setMelodyMarkingMissing] = useState(false);
  const [selectedMelodyIndex, setSelectedMelodyIndex] = useState<number | null>(null);
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
      const nextOrderIndex = minigames.length > 0 ? Math.max(...minigames.map((item) => item.orderIndex || 0)) + 1 : 1;
      setMinigameForm({
        ...emptyMinigame,
        title: '',
        challengeType: 'RHYTHM_MATCH',
        difficulty: 'BEGINNER',
        maxScore: 100,
        orderIndex: nextOrderIndex,
      });
      setRhythmDraft({ ...RHYTHM_MATCH_CONFIG, rounds: [newRhythmRound(1, lesson?.instrument)] });
      setMelodyDraft(MELODY_COMPLETE_CONFIG);
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
    } else {
      const config = parseMelodyConfig(item.contentJson);
      setMelodyDraft(config);
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
                            <Flame className="w-3.5 h-3.5" /> {rhythmConfig.rounds.length} vòng luyện
                          </span>
                          {rhythmConfig.rounds[0] && (
                            <span className="inline-flex items-center gap-1 font-semibold bg-[#1D4532]/10 px-2 py-1 rounded text-[#1D4532]">
                              Nhịp {getTimeSignatureLabel(rhythmConfig.rounds[0].time_signature)}
                            </span>
                          )}
                          <span className="inline-flex items-center gap-1 bg-neutral-100 px-2 py-1 rounded text-neutral-700">
                            <Timer className="w-3.5 h-3.5" /> {rhythmConfig.rounds.reduce((total, round) => total + round.events.length, 0)} sự kiện nốt
                          </span>
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
          <div className="w-full max-w-xl md:max-w-2xl h-full bg-white p-6 md:p-8 overflow-y-auto shadow-2xl custom-scrollbar animate-[slideIn_0.32s_cubic-bezier(0.22,1,0.36,1)]" onMouseDown={(event) => event.stopPropagation()}>
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

                      {false && minigameForm.challengeType !== 'RHYTHM_MATCH' && <div className="grid grid-cols-3 gap-3">
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
                      </div>}

                      {minigameForm.challengeType === 'RHYTHM_MATCH' && (
                        <section className="rounded-2xl border border-[#1D4532]/20 bg-[#fbf9f4] p-4 sm:p-5 space-y-4">
                          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#1D4532]/10 pb-3">
                            <div>
                              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#1D4532]">
                                Thiết lập vòng chơi Mini game 1
                              </p>
                              <p className="mt-1 text-xs text-on-surface-variant">Mỗi nốt cần có cao độ và thời điểm để app hiển thị đúng trên khuông nhạc.</p>
                            </div>
                            <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2.5 py-1 rounded-full">{rhythmDraft.rounds.length} vòng</span>
                          </div>

                          <div className="space-y-4">
                            {rhythmDraft.rounds.map((round, roundIndex) => {
                              const noteOptions = notesForInstrument(lesson?.instrument);
                              const updateRound = (next: RhythmRoundConfig) => setRhythmDraft((prev) => ({ ...prev, rounds: prev.rounds.map((item, index) => index === roundIndex ? next : item) }));
                              return (
                                <article key={roundIndex} className="rounded-xl border border-[#1D4532]/15 bg-white p-3.5 sm:p-4 space-y-3.5 shadow-sm">
                                  <div className="flex flex-wrap items-center justify-between gap-2.5">
                                    <div className="flex items-center gap-2 flex-1 min-w-[180px]">
                                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#1D4532] text-xs font-bold text-white shadow-sm">{roundIndex + 1}</span>
                                      <input
                                        value={round.title ?? ''}
                                        onChange={(e) => updateRound({ ...round, title: e.target.value })}
                                        placeholder={`Vòng ${roundIndex + 1}`}
                                        className="input h-10 py-1.5 px-3 font-semibold text-sm flex-1 min-w-[120px]"
                                      />
                                    </div>
                                    <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                                      <div className="flex items-center bg-[#fbf9f4] border border-outline-variant/30 rounded-xl px-2.5 h-10">
                                        <span className="text-xs font-semibold text-on-surface-variant mr-1.5">Nhịp:</span>
                                        <select
                                          value={round.time_signature ? `${round.time_signature[0]}/${round.time_signature[1]}` : '4/4'}
                                          onChange={(e) => {
                                            const [num, den] = e.target.value.split('/').map(Number);
                                            updateRound({ ...round, time_signature: [num, den] as TimeSignature });
                                          }}
                                          className="bg-transparent text-xs font-bold text-[#1D4532] outline-none cursor-pointer"
                                          aria-label={`Chỉ số nhịp vòng ${roundIndex + 1}`}
                                        >
                                          <option value="2/4">2/4 (2 phách/ô)</option>
                                          <option value="3/4">3/4 (3 phách/ô)</option>
                                          <option value="4/4">4/4 (4 phách/ô)</option>
                                          <option value="6/8">6/8 (3 phách/ô · 6 móc đơn)</option>
                                        </select>
                                      </div>
                                      <div className="flex items-center bg-[#fbf9f4] border border-outline-variant/30 rounded-xl px-2.5 h-10">
                                        <span className="text-xs font-semibold text-on-surface-variant mr-1.5">BPM:</span>
                                        <input
                                          type="number"
                                          min="30"
                                          max="300"
                                          value={round.tempo_bpm}
                                          onChange={(e) => updateRound({ ...round, tempo_bpm: Number(e.target.value) || 100 })}
                                          className="w-12 bg-transparent text-sm font-bold text-center outline-none"
                                          aria-label={`BPM vòng ${roundIndex + 1}`}
                                        />
                                      </div>
                                      <div className="flex items-center border border-outline-variant/20 rounded-xl p-0.5 bg-[#fbf9f4]">
                                        <button
                                          type="button"
                                          disabled={roundIndex === 0}
                                          onClick={() => setRhythmDraft((prev) => {
                                            const rounds = [...prev.rounds];
                                            [rounds[roundIndex - 1], rounds[roundIndex]] = [rounds[roundIndex], rounds[roundIndex - 1]];
                                            return { ...prev, rounds };
                                          })}
                                          className="p-1.5 rounded-lg text-[#1D4532] hover:bg-white disabled:opacity-30 transition-colors"
                                          title="Đưa vòng lên"
                                        >
                                          <ArrowUp className="h-4 w-4" />
                                        </button>
                                        <button
                                          type="button"
                                          disabled={roundIndex === rhythmDraft.rounds.length - 1}
                                          onClick={() => setRhythmDraft((prev) => {
                                            const rounds = [...prev.rounds];
                                            [rounds[roundIndex], rounds[roundIndex + 1]] = [rounds[roundIndex + 1], rounds[roundIndex]];
                                            return { ...prev, rounds };
                                          })}
                                          className="p-1.5 rounded-lg text-[#1D4532] hover:bg-white disabled:opacity-30 transition-colors"
                                          title="Đưa vòng xuống"
                                        >
                                          <ArrowDown className="h-4 w-4" />
                                        </button>
                                        <button
                                          type="button"
                                          disabled={rhythmDraft.rounds.length === 1}
                                          onClick={() => {
                                            setRhythmDraft((prev) => ({ ...prev, rounds: prev.rounds.filter((_, index) => index !== roundIndex) }));
                                          }}
                                          className="p-1.5 rounded-lg text-red-600 hover:bg-white disabled:opacity-30 transition-colors"
                                          title="Xóa vòng"
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </button>
                                      </div>
                                    </div>
                                  </div>

                                  {(() => {
                                    const timeSig = round.time_signature ?? [4, 4];
                                    const measureDuration = getMeasureDurationBeats(timeSig);
                                    const totalBeats = round.events.reduce((sum, ev) => sum + ev.duration_beats, 0);
                                    const fullMeasures = totalBeats / measureDuration;
                                    const isClosed = totalBeats > 0 && (Math.abs(totalBeats % measureDuration) < 0.001 || Math.abs((totalBeats % measureDuration) - measureDuration) < 0.001);
                                    return (
                                      <div className="flex items-center justify-between rounded-lg bg-[#fbf9f4] border border-outline-variant/20 px-3 py-1.5 text-xs">
                                        <span className="text-on-surface-variant">
                                          Nhịp <strong>{timeSig[0]}/{timeSig[1]}</strong> · {measureDuration} phách nốt đen/ô nhịp
                                        </span>
                                        <span className={`px-2 py-0.5 rounded font-semibold text-[11px] ${isClosed ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                                          {totalBeats} phách · {fullMeasures.toFixed(1)} ô {isClosed ? '✓ Khép kín' : '⚠️ Chưa đủ ô nhịp'}
                                        </span>
                                      </div>
                                    );
                                  })()}

                                  <div className="space-y-2">
                                    <div className="grid grid-cols-[1.5rem_6.5rem_minmax(0,1fr)_7.5rem_1.75rem] sm:grid-cols-[1.5rem_7.5rem_minmax(0,1fr)_8.5rem_1.75rem] gap-2 items-center px-1 text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                                      <span className="text-center">#</span>
                                      <span>Loại</span>
                                      <span>Nốt</span>
                                      <span>Trường độ</span>
                                      <span />
                                    </div>
                                    {round.events.map((event, noteIndex) => (
                                      <div key={noteIndex} className="grid grid-cols-[1.5rem_6.5rem_minmax(0,1fr)_7.5rem_1.75rem] sm:grid-cols-[1.5rem_7.5rem_minmax(0,1fr)_8.5rem_1.75rem] gap-2 items-center">
                                        <span className="text-center text-xs font-bold text-[#1D4532]">{noteIndex + 1}</span>
                                        <select
                                          value={event.mode}
                                          onChange={(e) => {
                                            const events = [...round.events];
                                            events[noteIndex] = { ...event, mode: e.target.value === 'SAMPLE' ? 'SAMPLE' : 'TARGET' };
                                            updateRound({ ...round, events });
                                          }}
                                          className="input h-10 px-2 py-1.5 text-xs font-semibold cursor-pointer"
                                        >
                                          <option value="SAMPLE">Nghe mẫu</option>
                                          <option value="TARGET">Cần chơi</option>
                                        </select>
                                        <select
                                          value={event.note}
                                          onChange={(e) => {
                                            const events = [...round.events];
                                            events[noteIndex] = { ...event, note: e.target.value };
                                            updateRound({ ...round, events });
                                          }}
                                          className="input h-10 px-2.5 py-1.5 text-xs cursor-pointer truncate font-medium"
                                        >
                                          <option value="">Chọn nốt</option>
                                          {noteOptions.map((note) => (
                                            <option key={note} value={note}>
                                              {noteOptionLabel(lesson?.instrument, note)}
                                            </option>
                                          ))}
                                        </select>
                                        <select
                                          value={event.duration_beats}
                                          onChange={(e) => {
                                            const events = [...round.events];
                                            events[noteIndex] = { ...event, duration_beats: Number(e.target.value) };
                                            updateRound({ ...round, events });
                                          }}
                                          className="input h-10 px-2 py-1.5 text-xs cursor-pointer truncate"
                                        >
                                          {NOTE_DURATIONS.map((duration) => (
                                            <option key={duration.value} value={duration.value}>
                                              {duration.label}
                                            </option>
                                          ))}
                                        </select>
                                        <button
                                          type="button"
                                          disabled={round.events.length <= 2}
                                          onClick={() => updateRound({ ...round, events: round.events.filter((_, index) => index !== noteIndex) })}
                                          className="p-1.5 text-neutral-400 hover:text-red-600 disabled:opacity-20 transition-colors flex justify-center"
                                          title="Xóa nốt"
                                        >
                                          <X className="h-4 w-4" />
                                        </button>
                                      </div>
                                    ))}
                                  </div>

                                  <button
                                    type="button"
                                    disabled={round.events.length >= 16}
                                    onClick={() => {
                                      updateRound({ ...round, events: [...round.events, { note: noteOptions[0], mode: 'TARGET', duration_beats: 1 }] });
                                    }}
                                    className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-800 hover:bg-emerald-100 disabled:opacity-40 transition-colors"
                                  >
                                    <Plus className="h-3.5 w-3.5" /> Thêm nốt
                                  </button>
                                </article>
                              );
                            })}
                          </div>

                          <button
                            type="button"
                            onClick={() => setRhythmDraft((prev) => ({ ...prev, rounds: [...prev.rounds, newRhythmRound(prev.rounds.length + 1, lesson?.instrument)] }))}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-[#1D4532]/40 bg-white/70 px-3.5 py-2 text-xs font-bold text-[#1D4532] hover:bg-emerald-50 transition-colors"
                          >
                            <Plus className="h-3.5 w-3.5" /> Thêm vòng
                          </button>
                        </section>
                      )}

                      {/* FORM 2: HOÀN THIỆN GIAI ĐIỆU (MELODY_COMPLETE) */}
                      {minigameForm.challengeType === 'MELODY_COMPLETE' && (
                        <section className="rounded-xl border border-purple-100 bg-white p-4 space-y-4">
                          <div className="flex items-center justify-between">
                            <p className="inline-flex items-center gap-1.5 text-sm font-bold text-[#4c1d75]">
                              <Sparkles className="w-4 h-4" /> Giai điệu
                            </p>
                            <span className="text-xs text-on-surface-variant">Chọn 1 nốt khuyết</span>
                          </div>

                          {/* DÃY GIAI ĐIỆU */}
                          <Field label={`Nốt giai điệu · ${melodyDraft.melody.length} nốt`}>
                            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
                              {notesForInstrument(lesson?.instrument).map((note) => (
                                <button key={note} type="button" onClick={() => setMelodyDraft((prev) => ({ ...prev, melody: [...prev.melody, note] }))}
                                  className="min-h-10 rounded-lg border border-purple-200 bg-purple-50 px-2 text-xs font-bold text-purple-900 transition hover:border-purple-500 hover:bg-purple-100 active:scale-[0.98]">
                                  {noteOptionLabel(lesson?.instrument, note)}
                                </button>
                              ))}
                            </div>
                            <span className="mt-2 block text-xs text-on-surface-variant">Bấm một nốt để thêm vào cuối câu giai điệu.</span>
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
                              <div className="grid grid-cols-2 gap-3 pt-1">
                                <Field label="BPM phát mẫu">
                                  <input type="number" min="30" max="300" value={melodyDraft.bpm ?? 80} onChange={(e) => setMelodyDraft((prev) => ({ ...prev, bpm: Number(e.target.value) || 80 }))} className="input h-10" />
                                </Field>
                                <Field label="Độ khó">
                                  <select value={minigameForm.difficulty ?? 'BEGINNER'} onChange={(e) => setMinigameForm((prev) => ({ ...prev, difficulty: e.target.value }))} className="input h-10 cursor-pointer">
                                    <option value="BEGINNER">Cơ bản</option><option value="INTERMEDIATE">Trung cấp</option><option value="ADVANCED">Nâng cao</option>
                                  </select>
                                </Field>
                              </div>
                            </div>
                          </details>

                          {melodyDraft.melody.length > 0 && (
                            <div>
                              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                                <p className="text-xs font-semibold text-neutral-700">Chuỗi giai điệu</p>
                                <button type="button" onClick={() => setMelodyMarkingMissing((active) => !active)} className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${melodyMarkingMissing ? 'bg-amber-500 text-white' : 'border border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100'}`}>
                                  {melodyMarkingMissing ? 'Chọn một nốt…' : 'Đánh dấu nốt khuyết'}
                                </button>
                              </div>
                              <p className="mb-3 text-xs text-on-surface-variant">{melodyMarkingMissing ? 'Bấm một chip để đặt nốt học viên sẽ chơi.' : 'Bấm chip để chọn; dùng mũi tên để đổi thứ tự hoặc × để xóa.'}</p>
                              <div className="flex flex-wrap items-center gap-2">
                                {melodyDraft.melody.map((note, index) => {
                                  const isMissing = melodyDraft.missing_index === index;
                                  const isSelected = selectedMelodyIndex === index;
                                  return (
                                    <div key={index} className="flex items-center">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (melodyMarkingMissing) {
                                          setMelodyDraft((prev) => ({ ...prev, missing_index: index, missing_positions: [index] }));
                                          setMelodyMarkingMissing(false);
                                        } else setSelectedMelodyIndex(index);
                                      }}
                                      title={melodyMarkingMissing ? `Đặt nốt ${index + 1} làm nốt khuyết` : `Chọn nốt ${index + 1}`}
                                      className={`h-11 min-w-11 rounded-lg border px-3 text-sm font-bold transition-all active:scale-95 ${
                                        isMissing
                                          ? 'border-2 border-dashed border-[#b45309] bg-amber-100 text-amber-900 shadow-sm'
                                          : isSelected ? 'border-purple-600 bg-purple-100 text-purple-950' : 'border-purple-200 bg-purple-50 text-purple-900 hover:bg-purple-100'
                                      }`}
                                    >
                                      <span className="mr-1 text-[10px] opacity-60">{index + 1}</span>{isMissing ? `? · ${note}` : note}
                                    </button>
                                    {isSelected && !melodyMarkingMissing && <>
                                      <button type="button" disabled={index === 0} onClick={() => setMelodyDraft((prev) => { const melody = [...prev.melody]; [melody[index - 1], melody[index]] = [melody[index], melody[index - 1]]; const missing = prev.missing_index === index ? index - 1 : prev.missing_index === index - 1 ? index : prev.missing_index; return { ...prev, melody, missing_index: missing, missing_positions: missing === undefined ? [] : [missing] }; })} className="-ml-1 rounded p-1 text-purple-700 disabled:opacity-30" aria-label="Dịch nốt sang trái"><ArrowLeft className="h-3.5 w-3.5" /></button>
                                      <button type="button" disabled={index === melodyDraft.melody.length - 1} onClick={() => setMelodyDraft((prev) => { const melody = [...prev.melody]; [melody[index], melody[index + 1]] = [melody[index + 1], melody[index]]; const missing = prev.missing_index === index ? index + 1 : prev.missing_index === index + 1 ? index : prev.missing_index; return { ...prev, melody, missing_index: missing, missing_positions: missing === undefined ? [] : [missing] }; })} className="-ml-1 rounded p-1 text-purple-700 disabled:opacity-30" aria-label="Dịch nốt sang phải"><ArrowRight className="h-3.5 w-3.5" /></button>
                                    </>}
                                    <button type="button" title={`Xóa nốt ${index + 1}`} onClick={() => setMelodyDraft((prev) => {
                                      const nextMelody = prev.melody.filter((_, itemIndex) => itemIndex !== index);
                                      const nextMissing = prev.missing_index === index ? undefined : (prev.missing_index !== undefined && prev.missing_index > index ? prev.missing_index - 1 : prev.missing_index);
                                      return { ...prev, melody: nextMelody, missing_index: nextMissing, missing_positions: nextMissing === undefined ? [] : [nextMissing] };
                                    })} className="-ml-1 rounded-full p-1 text-neutral-400 hover:bg-red-50 hover:text-red-600" aria-label={`Xóa nốt ${index + 1}`}><X className="h-3.5 w-3.5" /></button>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {false && melodyDraft.missing_positions.length > 0 && (
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

                          <div className="hidden grid-cols-2 gap-4">
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
                            {false && <Field label="Thời gian giới hạn (giây)">
                              <input
                                type="number"
                                min="5"
                                max="300"
                                required
                                value={melodyDraft.time_limit_sec ?? 30}
                                onChange={(e) => setMelodyDraft((prev) => ({ ...prev, time_limit_sec: e.target.value ? Number(e.target.value) : undefined }))}
                                className="input font-semibold"
                              />
                            </Field>}
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
