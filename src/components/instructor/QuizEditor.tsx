import { useState, type FormEvent } from 'react';
import { AlertCircle, Check, Music4, Plus, Trash2 } from 'lucide-react';
import type { Quiz, QuizInput, QuizQuestionType } from '../../api/lessonContent';

const MIN_OPTIONS = 4;

const parseQuizOptions = (value: string): string[] => {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
};

const optionLetter = (index: number) => String.fromCharCode(65 + index);

interface QuizEditorProps {
  initial: Quiz | null;
  defaultOrderIndex: number;
  saving: boolean;
  apiError?: string;
  onCancel: () => void;
  onSubmit: (body: QuizInput) => void;
}

const QuizEditor = ({ initial, defaultOrderIndex, saving, apiError, onCancel, onSubmit }: QuizEditorProps) => {
  const isEditing = initial !== null;

  const [title, setTitle] = useState(initial?.title ?? '');
  const [questionType, setQuestionType] = useState<QuizQuestionType>(initial?.questionType ?? 'GENERAL');
  const [note, setNote] = useState(initial?.note ?? '');
  const [audioUrl, setAudioUrl] = useState(initial?.audioUrl ?? '');
  const [question, setQuestion] = useState(initial?.question ?? '');
  const [options, setOptions] = useState<string[]>(() => {
    const parsed = initial ? parseQuizOptions(initial.options) : [];
    const base = parsed.length >= MIN_OPTIONS ? parsed : Array<string>(MIN_OPTIONS).fill('');
    return base.length >= MIN_OPTIONS ? base : [...base, ...Array<string>(MIN_OPTIONS - base.length).fill('')];
  });
  const [correctIndex, setCorrectIndex] = useState<number | null>(() => {
    if (!initial?.correctAnswer) return null;
    const index = parseQuizOptions(initial.options).indexOf(initial.correctAnswer);
    return index >= 0 ? index : null;
  });
  const [orderIndex, setOrderIndex] = useState(initial?.orderIndex ?? defaultOrderIndex);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const clearError = (key: string) => {
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const updateOption = (index: number, value: string) => {
    setOptions((prev) => prev.map((item, i) => (i === index ? value : item)));
    clearError(`option-${index}`);
  };

  const addOption = () => {
    setOptions((prev) => [...prev, '']);
  };

  const removeOption = (index: number) => {
    if (options.length <= MIN_OPTIONS) return;
    setOptions((prev) => prev.filter((_, i) => i !== index));
    setCorrectIndex((prev) => {
      if (prev === null) return null;
      if (prev === index) return null;
      return prev > index ? prev - 1 : prev;
    });
    clearError(`option-${index}`);
  };

  const markCorrect = (index: number) => {
    setCorrectIndex(index);
    clearError('correct');
  };

  const correctPreview = correctIndex !== null ? options[correctIndex].trim() : '';
  const trimmedOptions = options.map((item) => item.trim());
  const filledOptions = trimmedOptions.filter(Boolean);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const nextErrors: Record<string, string> = {};

    if (!title.trim()) nextErrors.title = 'Vui lòng nhập tiêu đề câu hỏi.';

    if (questionType === 'NOTE_IDENTIFICATION' && !note.trim()) {
      nextErrors.note = 'Loại câu hỏi nhận diện nốt nhạc cần nhập nốt nhạc (ví dụ: A4).';
    }

    if (!question.trim()) nextErrors.question = 'Vui lòng nhập nội dung câu hỏi.';

    if (filledOptions.length < MIN_OPTIONS) {
      nextErrors.options = `Hệ thống yêu cầu tối thiểu ${MIN_OPTIONS} lựa chọn (hiện có ${filledOptions.length}).`;
    } else if (new Set(filledOptions).size !== filledOptions.length) {
      nextErrors.options = 'Các lựa chọn không được trùng nhau.';
    }

    const selectedCorrect = correctIndex !== null ? options[correctIndex].trim() : '';
    if (!selectedCorrect || !filledOptions.includes(selectedCorrect)) {
      nextErrors.correct = 'Vui lòng đánh dấu một đáp án đúng bằng vòng tròn bên cạnh lựa chọn.';
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    onSubmit({
      title: title.trim(),
      questionType,
      note: note.trim() || undefined,
      audioUrl: audioUrl.trim() || undefined,
      question: question.trim(),
      options: JSON.stringify(filledOptions),
      correctAnswer: selectedCorrect,
      orderIndex,
    });
  };

  return (
    <form onSubmit={(event) => void handleSubmit(event)} noValidate className="space-y-7">
      {apiError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {apiError}
        </div>
      )}

      <section>
        <h3 className="mb-2.5 text-xs font-bold uppercase tracking-[0.18em] text-[#1D4532]">Thông tin cơ bản</h3>

        <div className="space-y-5">
          <div>
            <input
              value={title}
              onChange={(event) => {
                setTitle(event.target.value);
                clearError('title');
              }}
              placeholder="Tiêu đề câu hỏi — ví dụ: Nhận diện nốt A4"
              className={`input ${errors.title ? 'border-red-300 focus:border-red-400 focus:ring-red-200' : ''}`}
            />
            {errors.title && <FieldError message={errors.title} />}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <select
                value={questionType}
                onChange={(event) => {
                  setQuestionType(event.target.value as QuizQuestionType);
                  clearError('note');
                }}
                className="input cursor-pointer"
              >
                <option value="GENERAL">Kiến thức chung (General)</option>
                <option value="NOTE_IDENTIFICATION">Nhận diện nốt nhạc (Note)</option>
              </select>
              <span className="mt-2 block text-xs text-on-surface-variant/70">
                Loại câu hỏi quyết định cách học viên làm bài.
              </span>
            </div>
            <div>
              <input
                value={audioUrl}
                onChange={(event) => setAudioUrl(event.target.value)}
                placeholder="URL âm thanh (không bắt buộc)"
                className="input"
              />
              <span className="mt-2 block text-xs text-on-surface-variant/70">
                Dán liên kết file audio để phát trong câu hỏi.
              </span>
            </div>
          </div>

          {questionType === 'NOTE_IDENTIFICATION' && (
            <div style={{ animationDelay: '0ms' }} className="animate-[fadeUp_0.25s_ease-out_both]">
              <div className="flex items-center gap-2">
                <Music4 className="h-4 w-4 text-[#1D4532]" />
                <span className="text-sm font-semibold text-on-surface-variant">Nốt nhạc cần nhận diện</span>
              </div>
              <input
                value={note}
                onChange={(event) => {
                  setNote(event.target.value);
                  clearError('note');
                }}
                placeholder="Ví dụ: A4"
                className={`input mt-2 ${errors.note ? 'border-red-300 focus:border-red-400 focus:ring-red-200' : ''}`}
              />
              {errors.note && <FieldError message={errors.note} />}
            </div>
          )}
        </div>
      </section>

      <section>
        <div className="mb-2.5 flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-[0.18em] text-[#1D4532]">Câu hỏi</h3>
          <span className="text-[11px] font-medium text-on-surface-variant/60">{question.length} ký tự</span>
        </div>
        <textarea
          autoFocus
          rows={3}
          required
          value={question}
          onChange={(event) => {
            setQuestion(event.target.value);
            clearError('question');
          }}
          placeholder="Ví dụ: Nốt A4 có tần số chuẩn là bao nhiêu?"
          className={`input min-h-28 resize-y ${errors.question ? 'border-red-300 focus:border-red-400 focus:ring-red-200' : ''}`}
        />
        {errors.question && <FieldError message={errors.question} />}
      </section>

      <section>
        <div className="mb-2.5">
          <h3 className="text-xs font-bold uppercase tracking-[0.18em] text-[#1D4532]">Các lựa chọn</h3>
          <p className="mt-1 text-xs text-on-surface-variant/70">
            Hệ thống yêu cầu tối thiểu {MIN_OPTIONS} lựa chọn — bấm vòng tròn để đánh dấu đáp án đúng.
          </p>
        </div>

        <div className="space-y-2.5">
          {options.map((option, index) => (
            <div
              key={index}
              style={{ animationDelay: `${index * 40}ms` }}
              className={`group flex items-center gap-3 rounded-xl border bg-[#fbf9f4] px-3 py-2.5 transition-all duration-200 animate-[fadeUp_0.3s_ease-out_both] ${
                correctIndex === index
                  ? 'border-[#1D4532]/40 bg-[#1D4532]/[0.03]'
                  : 'border-outline-variant/30 focus-within:border-[#1D4532]/50 focus-within:ring-2 focus-within:ring-[#1D4532]/10'
              }`}
            >
              <label
                className={`flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-full border-2 transition-all duration-200 focus-within:ring-2 focus-within:ring-[#1D4532]/30 ${
                  correctIndex === index
                    ? 'border-[#1D4532] bg-[#1D4532] text-white shadow-sm'
                    : 'border-outline-variant/60 text-transparent hover:border-[#1D4532]/50'
                }`}
                title="Đánh dấu là đáp án đúng"
              >
                <input
                  type="radio"
                  name="correct-option"
                  className="sr-only"
                  checked={correctIndex === index}
                  onChange={() => markCorrect(index)}
                />
                <Check className="h-4 w-4" strokeWidth={3} aria-hidden />
              </label>

              <span className="w-5 shrink-0 text-center text-xs font-bold tabular-nums text-[#1D4532]/70">
                {optionLetter(index)}
              </span>

              <input
                value={option}
                onChange={(event) => updateOption(index, event.target.value)}
                placeholder={`Lựa chọn ${optionLetter(index)}`}
                className="min-w-0 flex-1 bg-transparent text-sm text-on-surface outline-none placeholder:text-on-surface-variant/40"
              />

              <button
                type="button"
                disabled={options.length <= MIN_OPTIONS}
                onClick={() => removeOption(index)}
                className="shrink-0 rounded-lg p-1.5 text-on-surface-variant/50 transition-all duration-200 hover:bg-red-50 hover:text-red-700 active:scale-90 disabled:cursor-not-allowed disabled:opacity-25 disabled:hover:bg-transparent disabled:hover:text-on-surface-variant/50"
                title="Xóa lựa chọn"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={addOption}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-[#1D4532]/40 px-4 py-3 text-sm font-semibold text-[#1D4532] transition-all duration-200 hover:bg-[#1D4532]/5 active:scale-[0.99]"
        >
          <Plus className="h-4 w-4" /> Thêm lựa chọn
        </button>

        {errors.options && <FieldError message={errors.options} />}
        {errors.correct && <FieldError message={errors.correct} />}

        {correctPreview && (
          <p className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-[#1D4532]/8 px-3 py-1.5 text-xs font-medium text-[#1D4532]">
            <Check className="h-3.5 w-3.5" strokeWidth={3} />
            Đáp án đúng: <span className="font-bold">{correctPreview}</span>
          </p>
        )}
      </section>

      <section>
        <label className="block">
          <span className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-[#1D4532]">
            Thứ tự hiển thị
          </span>
          <input
            type="number"
            min={0}
            required
            value={orderIndex}
            onChange={(event) => setOrderIndex(Number(event.target.value))}
            className="input tabular-nums"
          />
          <span className="mt-2 block text-xs text-on-surface-variant/70">
            Câu hỏi sẽ xuất hiện dưới dạng &ldquo;CÂU HỎI #{orderIndex}&rdquo; trong danh sách.
          </span>
        </label>
      </section>

      <div className="grid grid-cols-2 gap-3 border-t border-outline-variant/20 pt-6">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-xl border border-outline-variant/40 px-5 py-3.5 font-bold text-on-surface-variant transition-all duration-200 hover:bg-[#f0eee9] active:scale-[0.98]"
        >
          Hủy
        </button>
        <button
          disabled={saving}
          className="rounded-xl bg-[#1D4532] px-5 py-3.5 font-bold text-white shadow-md shadow-[#1D4532]/20 transition-all duration-200 hover:bg-[#1D4532]/90 hover:shadow-lg hover:shadow-[#1D4532]/25 active:scale-[0.98] disabled:opacity-60 disabled:shadow-none"
        >
          {saving ? 'Đang lưu...' : isEditing ? 'Lưu thay đổi' : 'Tạo câu hỏi'}
        </button>
      </div>
    </form>
  );
};

const FieldError = ({ message }: { message: string }) => (
  <p className="mt-2 flex items-start gap-1.5 text-xs font-medium text-red-700">
    <AlertCircle className="mt-px h-3.5 w-3.5 shrink-0" /> {message}
  </p>
);

export default QuizEditor;
