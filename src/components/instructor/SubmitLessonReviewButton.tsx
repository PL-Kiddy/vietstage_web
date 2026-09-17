import { useRef, useState } from 'react';
import { Send } from 'lucide-react';
import { lessonsApi } from '../../api/services';

export default function SubmitLessonReviewButton({ id, title, status, onSubmitted }: {
  id: number; title: string; status?: string; onSubmitted: () => void | Promise<unknown>;
}) {
  const locked = useRef(false);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  if (!['DRAFT', 'REJECTED'].includes(status ?? '')) return null;
  const submit = async () => {
    if (locked.current || sent) return;
    if (!window.confirm(`Gửi bài “${title}” cho admin duyệt? Hãy bảo đảm nội dung và cấu hình bài học đã được lưu đầy đủ.`)) return;
    locked.current = true;
    setBusy(true);
    try {
      // Backend validates ownership, content readiness and status transition.
      await lessonsApi.updateStatus(id, 'PENDING');
      setSent(true);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Chưa gửi duyệt được. Vui lòng thử lại.');
      locked.current = false;
      setBusy(false);
      return;
    }
    try { await onSubmitted(); } catch {
      window.alert('Đã gửi duyệt nhưng chưa tải lại được danh sách. Vui lòng làm mới trang.');
    } finally { setBusy(false); }
  };
  return <button type="button" disabled={busy || sent} onClick={() => void submit()} className="flex w-full items-center gap-2 border-t px-4 py-2.5 text-left text-[13px] font-medium text-[#1D4532] hover:bg-[#EDF7F2] disabled:opacity-50"><Send className="h-4 w-4" />{sent ? 'Đã gửi duyệt' : busy ? 'Đang gửi...' : status === 'REJECTED' ? 'Gửi duyệt lại' : 'Gửi duyệt'}</button>;
}
