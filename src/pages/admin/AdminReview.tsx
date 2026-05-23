import React, { useState } from 'react';
import { Play, ZoomIn, X, Check, FileText } from 'lucide-react';

interface ReviewItem {
  id: string;
  title: string;
  instrument: string;
  instructor: string;
  date: string;
  sheetMusicUrl: string;
  audioUrl: string;
  duration: string;
}

const mockReviewItems: ReviewItem[] = [
  {
    id: 'MS-00245',
    title: 'Lưu Thủy Kim Tiền',
    instrument: 'Đàn Tranh',
    instructor: 'Trần Thế Nghĩa',
    date: '20/10/2024',
    sheetMusicUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAfg3iJoB4h0Q0ExatMk0LF9m04X0rBSM3Jt6QJ57PjPNBf25QyrOv3unEx0BJ0_LrTzAkhJHvCKvmQtm-efyzR42ER3CYB5ONIXLRVTqsbfYCX2IYfVo_k-u_BY3DJzE9Fr2v35w-iZu2scct9O7Zp7pwF2stnMoRwRwVV8ZnCTseS-5eE_EZhSTAZDUYQFLflwhafjkkIQCV0UXcZ_wt2q74uGiUWD9epmJfX_y-5TYCguAUIbj_Hmqm8cCwCBAGUG8tIjpaQJfeg',
    audioUrl: '#',
    duration: '04:12',
  },
  {
    id: 'MS-00246',
    title: 'Cổ Bản (Lớp 1)',
    instrument: 'Đàn Bầu',
    instructor: 'Nguyễn Thanh Tú',
    date: '21/10/2024',
    sheetMusicUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAfg3iJoB4h0Q0ExatMk0LF9m04X0rBSM3Jt6QJ57PjPNBf25QyrOv3unEx0BJ0_LrTzAkhJHvCKvmQtm-efyzR42ER3CYB5ONIXLRVTqsbfYCX2IYfVo_k-u_BY3DJzE9Fr2v35w-iZu2scct9O7Zp7pwF2stnMoRwRwVV8ZnCTseS-5eE_EZhSTAZDUYQFLflwhafjkkIQCV0UXcZ_wt2q74uGiUWD9epmJfX_y-5TYCguAUIbj_Hmqm8cCwCBAGUG8tIjpaQJfeg',
    audioUrl: '#',
    duration: '03:30',
  },
  {
    id: 'MS-00247',
    title: 'Vọng Cổ Cầu Mới',
    instrument: 'Đàn Kìm',
    instructor: 'Lê Hoàng Nam',
    date: '22/10/2024',
    sheetMusicUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAfg3iJoB4h0Q0ExatMk0LF9m04X0rBSM3Jt6QJ57PjPNBf25QyrOv3unEx0BJ0_LrTzAkhJHvCKvmQtm-efyzR42ER3CYB5ONIXLRVTqsbfYCX2IYfVo_k-u_BY3DJzE9Fr2v35w-iZu2scct9O7Zp7pwF2stnMoRwRwVV8ZnCTseS-5eE_EZhSTAZDUYQFLflwhafjkkIQCV0UXcZ_wt2q74uGiUWD9epmJfX_y-5TYCguAUIbj_Hmqm8cCwCBAGUG8tIjpaQJfeg',
    audioUrl: '#',
    duration: '05:00',
  },
];

const AdminReview = () => {
  // Initialize from LocalStorage
  const [items, setItems] = useState<ReviewItem[]>(() => {
    const saved = localStorage.getItem('vietstage_review_items');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Error parsing review items from localStorage:', e);
      }
    }
    return mockReviewItems;
  });

  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [feedback, setFeedback] = useState<string>('');
  const [isPreviewZoomed, setIsPreviewZoomed] = useState<boolean>(false);

  const saveItems = (updatedItems: ReviewItem[]) => {
    setItems(updatedItems);
    localStorage.setItem('vietstage_review_items', JSON.stringify(updatedItems));
  };

  const currentItem = items[activeIndex];

  const handleApprove = () => {
    if (!currentItem) return;
    alert(`Đã phê duyệt bài học: ${currentItem.title}`);
    const nextItems = items.filter((_, idx) => idx !== activeIndex);
    saveItems(nextItems);
    setActiveIndex(0);
    setFeedback('');
  };

  const handleReject = () => {
    if (!currentItem) return;
    if (!feedback.trim()) {
      alert('Vui lòng nhập lý do từ chối.');
      return;
    }
    alert(`Đã từ chối bài học: ${currentItem.title} với lý do: ${feedback}`);
    const nextItems = items.filter((_, idx) => idx !== activeIndex);
    saveItems(nextItems);
    setActiveIndex(0);
    setFeedback('');
  };

  return (
    <div className="max-w-container-max mx-auto relative">
      {/* Zoom Overlay */}
      {isPreviewZoomed && currentItem && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-md"
          onClick={() => setIsPreviewZoomed(false)}
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <button
              className="absolute top-4 right-4 bg-white/20 hover:bg-white/40 text-white rounded-full p-sm transition-all"
              onClick={() => setIsPreviewZoomed(false)}
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={currentItem.sheetMusicUrl}
              alt={currentItem.title}
              className="max-w-full max-h-[85vh] object-contain rounded-lg"
            />
          </div>
        </div>
      )}

      {/* Header Section */}
      <section className="mb-xl flex items-end justify-between">
        <div>
          <span className="text-[#735c00] font-label-md tracking-widest uppercase text-sm">
            Phê duyệt học liệu
          </span>
          <h3
            className="text-headline-lg font-bold text-primary mt-xs"
            style={{ fontFamily: "'Montserrat', sans-serif" }}
          >
            Hàng đợi kiểm duyệt
          </h3>
        </div>
        <button className="bg-primary text-on-primary px-lg py-md rounded-lg font-label-md text-label-md flex items-center gap-sm hover:opacity-90 transition-opacity">
          <FileText className="w-5 h-5" />
          Báo cáo mới
        </button>
      </section>

      {/* Grid Layout: Table & Preview */}
      {items.length === 0 ? (
        <div className="bg-white rounded-xl border border-[#d1e4fb]/50 p-xxl text-center shadow-sm flex flex-col items-center justify-center gap-md">
          <p className="text-body-md text-secondary">
            Hàng đợi trống. Không có tài liệu nào đang chờ kiểm duyệt!
          </p>
          <button
            onClick={() => saveItems(mockReviewItems)}
            className="bg-primary text-on-primary px-lg py-md rounded-lg font-label-md hover:bg-primary/95 transition-all shadow-sm"
          >
            Khôi phục danh sách mẫu để thử nghiệm
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-12 gap-lg items-start">
          {/* Queue List Column */}
          <div className="col-span-12 lg:col-span-7 space-y-md">
            <div className="bg-white rounded-xl border border-[#d1e4fb]/50 overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#e3efff] border-b border-[#d1e4fb]/50">
                    <th className="px-md py-lg font-label-md text-label-md text-on-surface">
                      Tên bài
                    </th>
                    <th className="px-md py-lg font-label-md text-label-md text-on-surface">
                      Nhạc cụ
                    </th>
                    <th className="px-md py-lg font-label-md text-label-md text-on-surface">
                      Giảng viên
                    </th>
                    <th className="px-md py-lg font-label-md text-label-md text-on-surface text-center">
                      Ngày gửi
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#d1e4fb]/30">
                  {items.map((item, idx) => {
                    const isActive = idx === activeIndex;
                    return (
                      <tr
                        key={item.id}
                        onClick={() => {
                          setActiveIndex(idx);
                          setFeedback('');
                        }}
                        className={`cursor-pointer transition-colors ${
                          isActive
                            ? 'bg-primary/5 hover:bg-primary/10 border-l-4 border-l-primary'
                            : 'hover:bg-[#edf4ff]'
                        }`}
                      >
                        <td className="px-md py-lg">
                          <div className="font-body-md font-semibold text-primary">
                            {item.title}
                          </div>
                          <div className="text-caption font-caption text-[#5e5e5b] text-[12px]">
                            ID: {item.id}
                          </div>
                        </td>
                        <td className="px-md py-lg">
                          <span className="px-sm py-xs bg-[#ffe088] text-[#241a00] rounded font-label-md text-[11px] uppercase tracking-wider font-semibold">
                            {item.instrument}
                          </span>
                        </td>
                        <td className="px-md py-lg text-body-md text-on-surface">
                          {item.instructor}
                        </td>
                        <td className="px-md py-lg text-center font-caption text-[#5e5e5b] text-[12px]">
                          {item.date}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Preview & Action Column */}
          {currentItem && (
            <div className="col-span-12 lg:col-span-5 sticky top-24">
              <div className="bg-white rounded-xl border border-[#d1e4fb]/50 p-lg shadow-sm">
                <h4
                  className="text-headline-md font-bold text-primary mb-md"
                  style={{ fontFamily: "'Montserrat', sans-serif" }}
                >
                  Trình xem trước
                </h4>

                {/* Sheet Music Preview */}
                <div className="relative group aspect-[3/4] bg-[#edf4ff] rounded-lg overflow-hidden border border-outline-variant mb-lg">
                  <img
                    src={currentItem.sheetMusicUrl}
                    alt="Sheet Music Preview"
                    className="w-full h-full object-cover opacity-85 transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-[#091d2e]/20 transition-opacity">
                    <button
                      className="bg-white/95 p-md rounded-full shadow-lg hover:scale-105 active:scale-95 transition-transform"
                      onClick={() => setIsPreviewZoomed(true)}
                    >
                      <ZoomIn className="w-6 h-6 text-primary" />
                    </button>
                  </div>
                </div>

                {/* Audio Waveform Preview */}
                <div className="bg-[#edf4ff] p-md rounded-lg mb-xl">
                  <div className="flex items-center justify-between mb-sm">
                    <span className="font-label-md text-label-md text-[#5e5e5b] truncate max-w-[200px]">
                      Audio_Preview_{currentItem.id}.wav
                    </span>
                    <span className="text-caption font-caption text-primary font-bold text-[12px]">
                      00:00 / {currentItem.duration}
                    </span>
                  </div>

                  <div className="h-16 flex items-end justify-between gap-[2px] relative overflow-hidden bg-[#e3efff] rounded p-sm">
                    {/* Simulated Waveform Bars */}
                    {[
                      60, 40, 55, 95, 30, 75, 65, 80, 50, 70, 90, 60, 45, 75,
                      35, 85, 70, 50, 65, 80, 45, 90, 55, 30, 70, 85, 60, 40,
                    ].map((val, index) => (
                      <div
                        key={index}
                        className="bg-primary/30 w-full rounded-full transition-all"
                        style={{ height: `${val}%` }}
                      />
                    ))}

                    <div className="absolute inset-0 flex items-center justify-center bg-transparent">
                      <button className="w-12 h-12 bg-primary text-on-primary rounded-full flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-transform">
                        <Play className="w-5 h-5 text-white fill-white ml-[3px]" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Moderation Actions */}
                <div className="space-y-md pt-md border-t border-[#d1e4fb]">
                  <div>
                    <label className="font-label-md text-label-md text-[#5e5e5b] block mb-xs">
                      Lý do phản hồi (nếu từ chối)
                    </label>
                    <textarea
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      className="w-full bg-[#f7f9ff] border border-outline/20 rounded-lg p-md text-body-md focus:border-primary focus:ring-0 h-24 transition-all outline-none"
                      placeholder="Nhập lý do chi tiết để giảng viên điều chỉnh..."
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-md">
                    <button
                      onClick={handleReject}
                      className="flex items-center justify-center gap-sm bg-error text-on-primary py-md rounded-lg font-label-md text-label-md hover:opacity-90 active:scale-[0.98] transition-all"
                    >
                      <X className="w-5 h-5" />
                      Từ chối
                    </button>
                    <button
                      onClick={handleApprove}
                      className="flex items-center justify-center gap-sm bg-[#1b5e20] text-white py-md rounded-lg font-label-md text-label-md hover:opacity-90 active:scale-[0.98] transition-all"
                    >
                      <Check className="w-5 h-5" />
                      Phê duyệt
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminReview;
