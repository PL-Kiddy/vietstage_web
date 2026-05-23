import React, { useState, useEffect } from 'react';
import { Play, Pause, X, Check, Eye, Search, FileText, ZoomIn } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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

  const [selectedItem, setSelectedItem] = useState<ReviewItem | null>(null);
  const [feedback, setFeedback] = useState<string>('');
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [isPreviewZoomed, setIsPreviewZoomed] = useState<boolean>(false);

  // Audio Player State
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);

  const durationSecs = selectedItem
    ? selectedItem.duration === '03:30'
      ? 210
      : selectedItem.duration === '05:00'
      ? 300
      : 252
    : 252;

  useEffect(() => {
    let interval: any;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentTime((prev) => {
          if (prev >= durationSecs) {
            setIsPlaying(false);
            return 0;
          }
          return prev + 1;
        });
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isPlaying, durationSecs]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const saveItems = (updatedItems: ReviewItem[]) => {
    setItems(updatedItems);
    localStorage.setItem('vietstage_review_items', JSON.stringify(updatedItems));
  };

  const openDrawer = (item: ReviewItem) => {
    setSelectedItem(item);
    setFeedback('');
    setIsPlaying(false);
    setCurrentTime(0);
    setIsDrawerOpen(true);
  };

  const closeDrawer = () => {
    setIsDrawerOpen(false);
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const handleApprove = () => {
    if (!selectedItem) return;
    alert(`Đã phê duyệt học liệu: ${selectedItem.title}`);
    const nextItems = items.filter((item) => item.id !== selectedItem.id);
    saveItems(nextItems);
    closeDrawer();
  };

  const handleReject = () => {
    if (!selectedItem) return;
    if (!feedback.trim()) {
      alert('Vui lòng nhập lý do từ chối.');
      return;
    }
    alert(`Đã từ chối học liệu: ${selectedItem.title} với lý do: ${feedback}`);
    const nextItems = items.filter((item) => item.id !== selectedItem.id);
    saveItems(nextItems);
    closeDrawer();
  };

  // Get instrument color tag style
  const getInstrumentTagClass = (ins: string) => {
    const lower = ins.toLowerCase();
    if (lower.includes('tranh')) {
      return 'bg-rose-50 border border-rose-200 text-rose-700';
    } else if (lower.includes('bầu')) {
      return 'bg-indigo-50 border border-indigo-200 text-indigo-700';
    } else if (lower.includes('kìm')) {
      return 'bg-amber-50 border border-amber-200 text-amber-700';
    }
    return 'bg-[#eae8e3] border border-outline-variant text-on-surface-variant';
  };

  return (
    <div className="w-full mx-auto relative min-h-screen bg-surface-bright text-on-surface font-sans p-md md:p-lg">
      {/* Zoom Sheet Music Overlay */}
      {isPreviewZoomed && selectedItem && (
        <div
          className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-md cursor-zoom-out"
          onClick={() => setIsPreviewZoomed(false)}
        >
          <div className="relative max-w-5xl max-h-[95vh] flex flex-col items-center">
            <button
              className="absolute top-4 right-4 bg-white/20 hover:bg-white/40 text-white rounded-full p-sm transition-all"
              onClick={() => setIsPreviewZoomed(false)}
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={selectedItem.sheetMusicUrl}
              alt={selectedItem.title}
              className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl border border-white/10"
            />
            <p className="text-white mt-md font-label-md bg-black/50 px-lg py-sm rounded-full">
              Khuông nhạc / Sheet nhạc: {selectedItem.title}
            </p>
          </div>
        </div>
      )}

      {/* Header Section */}
      <section className="mb-xl border-b border-outline-variant/10 pb-md">
        <span className="text-[#8b0000] font-bold text-label-md tracking-wider uppercase text-sm">
          Phê duyệt học liệu
        </span>
        <h3
          className="text-headline-lg font-bold text-[#8b0000] mt-xs"
          style={{ fontFamily: "'Montserrat', sans-serif" }}
        >
          Hàng đợi kiểm duyệt
        </h3>
      </section>

      {/* Table Section - occupy full width */}
      {items.length === 0 ? (
        <div className="bg-white rounded-xl border border-outline-variant/10 p-xxl text-center shadow-sm flex flex-col items-center justify-center gap-md">
          <p className="text-body-md text-on-surface-variant">
            Hàng đợi trống. Không có tài liệu nào đang chờ kiểm duyệt!
          </p>
          <button
            onClick={() => saveItems(mockReviewItems)}
            className="bg-primary text-on-primary px-xl py-md rounded-lg font-label-md hover:bg-primary/95 transition-all shadow-md"
          >
            Khôi phục danh sách mẫu để thử nghiệm
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-outline-variant/15 overflow-hidden shadow-sm w-full">
          <div className="px-xl py-lg border-b border-outline-variant/10 flex justify-between items-center bg-[#f5f3ee]/30">
            <span className="font-label-md text-label-md text-on-surface-variant font-semibold">
              Tài liệu chờ phê duyệt
            </span>
            <span className="px-md py-xs bg-[#eae8e3] rounded-full text-label-sm font-label-sm font-bold text-on-surface-variant">
              {items.length} tài liệu chờ duyệt
            </span>
          </div>

          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-[#f5f3ee]/50 border-b border-outline-variant/10">
                  <th className="px-xl py-md font-label-sm text-label-sm text-on-surface-variant font-bold uppercase tracking-wider">
                    Tên bài
                  </th>
                  <th className="px-xl py-md font-label-sm text-label-sm text-on-surface-variant font-bold uppercase tracking-wider">
                    Nhạc cụ
                  </th>
                  <th className="px-xl py-md font-label-sm text-label-sm text-on-surface-variant font-bold uppercase tracking-wider">
                    Giảng viên
                  </th>
                  <th className="px-xl py-md font-label-sm text-label-sm text-on-surface-variant font-bold uppercase tracking-wider">
                    Ngày gửi
                  </th>
                  <th className="px-xl py-md font-label-sm text-label-sm text-on-surface-variant font-bold uppercase tracking-wider">
                    Trạng thái
                  </th>
                  <th className="px-xl py-md font-label-sm text-label-sm text-on-surface-variant font-bold uppercase tracking-wider text-right">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-[#f5f3ee]/20 transition-colors">
                    <td className="px-xl py-lg">
                      <div className="font-body-md font-bold text-[#8b0000]">{item.title}</div>
                      <div className="text-[12px] text-on-surface-variant">ID: {item.id}</div>
                    </td>
                    <td className="px-xl py-lg">
                      <span className={`px-lg py-sm rounded-full text-[11px] font-bold uppercase tracking-wide ${getInstrumentTagClass(item.instrument)}`}>
                        {item.instrument}
                      </span>
                    </td>
                    <td className="px-xl py-lg text-body-md text-on-surface font-semibold">
                      {item.instructor}
                    </td>
                    <td className="px-xl py-lg text-body-md text-on-surface-variant">
                      {item.date}
                    </td>
                    <td className="px-xl py-lg">
                      <span className="px-lg py-sm bg-orange-50 border border-orange-200 text-orange-700 rounded-full text-[11px] font-bold tracking-wide">
                        Chờ duyệt
                      </span>
                    </td>
                    <td className="px-xl py-lg text-right">
                      <button
                        onClick={() => openDrawer(item)}
                        className="inline-flex items-center gap-xs bg-[#8b0000] text-white px-lg py-sm rounded-lg font-label-sm text-label-sm hover:bg-[#8b0000]/90 transition-all active:scale-95 shadow-sm"
                      >
                        <Eye className="w-4 h-4" />
                        Kiểm duyệt
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Drawer Component using Framer Motion */}
      <AnimatePresence>
        {isDrawerOpen && selectedItem && (
          <>
            {/* Backdrop Blur Overlay */}
            <motion.div
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeDrawer}
            />

            {/* Slide-in Drawer */}
            <motion.div
              className="fixed top-0 right-0 h-full w-[100%] sm:w-[65%] md:w-[55%] lg:w-[50%] bg-surface-bright border-l border-outline-variant/15 shadow-2xl z-50 overflow-hidden flex flex-col"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            >
              {/* Drawer Header */}
              <div className="px-xl py-lg border-b border-outline-variant/10 flex justify-between items-center bg-[#f5f3ee]/30">
                <div>
                  <h4 className="text-headline-md font-bold text-[#8b0000] font-sans">
                    Trình xem trước học liệu
                  </h4>
                  <p className="text-[12px] text-on-surface-variant mt-xs">
                    {selectedItem.title} ({selectedItem.id}) • Gửi bởi {selectedItem.instructor}
                  </p>
                </div>
                <button
                  onClick={closeDrawer}
                  className="p-md hover:bg-[#eae8e3]/80 rounded-full text-on-surface-variant hover:text-on-surface transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Drawer Body - Scrollable content area */}
              <div className="flex-1 overflow-y-auto p-xl space-y-xl custom-scrollbar">
                {/* Visual Preview Card (Glass effect, kem trang background) */}
                <div className="bg-white/95 backdrop-blur-md border border-outline-variant/10 rounded-2xl p-lg shadow-sm space-y-lg">
                  {/* Sheet Music Section */}
                  <div>
                    <span className="font-label-sm text-on-surface-variant block mb-sm font-semibold uppercase tracking-wider text-xs">
                      1. Khuông nhạc / Sheet nhạc
                    </span>
                    <div className="relative group aspect-[4/3] bg-[#f5f3ee] rounded-xl overflow-hidden border border-outline-variant/20 flex items-center justify-center">
                      <img
                        src={selectedItem.sheetMusicUrl}
                        alt="Sheet Music Preview"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/15 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => setIsPreviewZoomed(true)}
                          className="bg-white text-[#8b0000] px-lg py-md rounded-full shadow-lg font-label-md flex items-center gap-xs hover:scale-105 active:scale-95 transition-transform"
                        >
                          <ZoomIn className="w-5 h-5" />
                          Phóng to ảnh
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Audio Player Section */}
                  <div>
                    <span className="font-label-sm text-on-surface-variant block mb-sm font-semibold uppercase tracking-wider text-xs">
                      2. Bản âm thanh minh họa
                    </span>
                    <div className="bg-[#f5f3ee]/50 border border-outline-variant/10 rounded-xl p-md">
                      <div className="flex justify-between items-center mb-sm">
                        <span className="text-label-sm font-bold text-on-surface truncate max-w-[200px]">
                          preview_audio_{selectedItem.id}.mp3
                        </span>
                        <span className="text-label-sm font-bold text-[#8b0000]">
                          {formatTime(currentTime)} / {selectedItem.duration}
                        </span>
                      </div>

                      {/* Interactive Waveform visual */}
                      <div className="h-16 flex items-end justify-between gap-[3px] relative overflow-hidden bg-white/60 border border-outline-variant/10 rounded p-sm mb-md">
                        {[
                          60, 40, 55, 95, 30, 75, 65, 80, 50, 70, 90, 60, 45, 75,
                          35, 85, 70, 50, 65, 80, 45, 90, 55, 30, 70, 85, 60, 40,
                        ].map((val, index, arr) => {
                          const percent = currentTime / durationSecs;
                          const barPercent = index / arr.length;
                          const isPlayed = barPercent <= percent;

                          return (
                            <div
                              key={index}
                              className={`w-full rounded-full transition-all duration-300 ${
                                isPlayed ? 'bg-[#8b0000]' : 'bg-[#8b0000]/25'
                              }`}
                              style={{
                                height: isPlaying
                                  ? `${Math.min(100, val + Math.sin(currentTime * 2 + index) * 15)}%`
                                  : `${val}%`,
                              }}
                            />
                          );
                        })}
                      </div>

                      <div className="flex justify-center">
                        <button
                          onClick={() => setIsPlaying(!isPlaying)}
                          className="w-12 h-12 bg-[#8b0000] text-white rounded-full flex items-center justify-center shadow-md hover:scale-105 active:scale-95 transition-transform"
                        >
                          {isPlaying ? (
                            <Pause className="w-5 h-5 text-white fill-white" />
                          ) : (
                            <Play className="w-5 h-5 text-white fill-white ml-[3px]" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Feedback Textarea */}
                  <div className="pt-md border-t border-outline-variant/10">
                    <label className="font-label-sm text-on-surface-variant block mb-xs font-semibold uppercase tracking-wider text-xs">
                      Lý do phản hồi (nếu từ chối)
                    </label>
                    <textarea
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      className="w-full bg-[#fbf9f4] border border-outline-variant/30 rounded-xl p-md text-body-md focus:border-[#8b0000] focus:ring-1 focus:ring-[#8b0000] h-28 transition-all outline-none"
                      placeholder="Nhập lý do chi tiết để giảng viên điều chỉnh..."
                    />
                  </div>
                </div>
              </div>

              {/* Drawer Footer Actions (Fixed at bottom) */}
              <div className="px-xl py-lg border-t border-outline-variant/10 bg-[#f5f3ee]/40 flex gap-md">
                <button
                  onClick={handleReject}
                  className="flex-1 flex items-center justify-center gap-sm bg-[#c62828] text-white py-lg rounded-xl font-bold hover:bg-[#b71c1c] active:scale-[0.98] transition-all shadow-sm"
                >
                  <X className="w-5 h-5" />
                  Từ chối
                </button>
                <button
                  onClick={handleApprove}
                  className="flex-1 flex items-center justify-center gap-sm bg-[#1b5e20] text-white py-lg rounded-xl font-bold hover:bg-[#1b5e20]/90 active:scale-[0.98] transition-all shadow-sm"
                >
                  <Check className="w-5 h-5" />
                  Phê duyệt
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminReview;
