import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Send } from 'lucide-react';
import { lessonsApi } from '../../api/services';
import { profileApi } from '../../api/management';

export default function SubmitLessonReviewButton({ id, title, status, createdById, onSubmitted }: {
  id: number; title: string; status?: string; createdById?: number; onSubmitted: () => void | Promise<unknown>;
}) {
  const locked = useRef(false);
  const [permission, setPermission] = useState('loading');
  const [retry, setRetry] = useState(0);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    const controller = new AbortController();
    setPermission('loading');
    profileApi.get({ signal: controller.signal }).then(user => {
      if (!controller.signal.aborted) setPermission(createdById === undefined ? 'error' : user.id === createdById && user.role.toUpperCase() === 'INSTRUCTOR' ? 'owner' : 'other');
    }).catch(() => { if (!controller.signal.aborted) setPermission('error'); });
    return () => controller.abort();
  }, [createdById, retry]);
  if (!['DRAFT', 'REJECTED'].includes(status ?? '') || permission === 'other') return null;
  const submit = async () => {
    if (locked.current || sent || permission !== 'owner') return;
    locked.current = true;
    setBusy(true); setError('');
    try {
      await lessonsApi.updateStatus(id, 'PENDING');
      setSent(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Chưa gửi duyệt được. Vui lòng thử lại.');
      locked.current = false;
    } finally { setBusy(false); }
  };
  const refresh = async () => {
    setBusy(true); setError('');
    try { await onSubmitted(); setOpen(false); }
    catch { setError('Đã gửi duyệt thành công nhưng chưa tải lại được danh sách. Vui lòng thử cập nhật lại.'); }
    finally { setBusy(false); }
  };
  return <>
    {permission === 'error' ? <p className="px-4 py-2 text-xs text-amber-800">Chưa xác định được quyền gửi duyệt. <button type="button" className="underline" onClick={() => setRetry(value => value + 1)}>Thử lại</button></p> :
    <button type="button" disabled={permission !== 'owner'} onClick={() => setOpen(true)} className="flex w-full items-center gap-2 border-t px-4 py-2.5 text-left text-[13px] font-medium text-[#1D4532] hover:bg-[#EDF7F2] disabled:opacity-50"><Send className="h-4 w-4" />{permission === 'loading' ? 'Đang kiểm tra quyền…' : sent ? 'Đã gửi duyệt' : status === 'REJECTED' ? 'Gửi duyệt lại' : 'Gửi duyệt'}</button>}
    {open && createPortal(<div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4" onClick={event => event.stopPropagation()}>
      <section role="dialog" aria-modal="true" aria-labelledby={`submit-review-${id}`} className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl" onKeyDown={event => { if (event.key === 'Escape' && !busy && !sent) setOpen(false); }}>
        <h2 id={`submit-review-${id}`} className="text-xl font-bold text-[#1D4532]">{sent ? 'Đã gửi duyệt' : 'Gửi bài học để duyệt'}</h2>
        <p className="mt-3 break-words font-semibold">{title}</p>
        <p className="mt-2 text-sm text-on-surface-variant">{sent ? 'Bài học đã được gửi cho quản trị viên xét duyệt.' : 'Hãy bảo đảm nội dung và cấu hình bài học đã được lưu đầy đủ trước khi gửi.'}</p>
        {error && <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <div className="mt-6 flex justify-end gap-3">
          {!sent && <button autoFocus type="button" disabled={busy} onClick={() => setOpen(false)} className="rounded-lg border px-4 py-2">Hủy</button>}
          <button type="button" disabled={busy} onClick={() => void (sent ? refresh() : submit())} className="rounded-lg bg-[#1D4532] px-4 py-2 font-semibold text-white disabled:opacity-50">{busy ? 'Đang xử lý…' : sent ? 'Cập nhật danh sách' : 'Gửi duyệt'}</button>
        </div>
      </section>
    </div>, document.body)}
  </>;
}
