import React, { useState } from 'react';
import {
  Folder,
  Video,
  Image,
  UploadCloud,
  FileAudio,
  FileVideo,
  FileImage,
  MoreVertical,
  Download,
  Trash2,
  Play,
  Plus,
} from 'lucide-react';

interface MediaFile {
  name: string;
  type: 'audio' | 'video' | 'image';
  updatedAt: string;
  size: string;
  format: string;
  duration?: string;
  resolution?: string;
  thumbnail?: string;
}

const mockFiles: MediaFile[] = [
  {
    name: 'Cai_Luong_Vong_Co_Lop_1.mp3',
    type: 'audio',
    updatedAt: 'Hôm nay, 10:45',
    size: '12.4 MB',
    format: 'MPEG Audio Layer III (MP3)',
    duration: '05:30',
  },
  {
    name: 'Huong_Dan_Go_Nhip_Phach.mp4',
    type: 'video',
    updatedAt: 'Hôm qua, 15:20',
    size: '245.8 MB',
    format: 'MPEG-4 Video (MP4)',
    duration: '12:45',
    resolution: '1920 x 1080',
    thumbnail: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDLMhEPRESsd_35Bh1XjeOLvfcc9uJaJ4tW_t6Qjy6tGuez08X4Y7IiWgc3DkPe1nQsmGFaAFs_IY2EHsth03aDTB57W8b92pZuaQLhU5-bDR-664Z5XsKqMx27GiyklPF7zdFiPu3gy0jIfdbbRDgtLm_nS3kSmhoV-tC8ayJl38-D0upJKxgvBIDISf7tPYylfXHiiWB_gKha1CnbhdoNJzfV-MtZvguaTKDbhPpDR_-J4y0gXjv0grWbYfCjq4KzeEldRiFOAb0k',
  },
  {
    name: 'So_Do_He_Thong_Ngu_Am.png',
    type: 'image',
    updatedAt: '12 Th05, 2024',
    size: '4.2 MB',
    format: 'PNG Portable Network Graphics',
    resolution: '2048 x 1536',
    thumbnail: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCvYuhNO1suPrcop2Dw6t-duQw9na-U1Gbm__j1f7tNM-bGEBDUFluZCKKNlbbjL2JhQt8tykntIGFVxKEbzd5a6Qi01SD0vVtD8YEqJVFA3y5yVO8K1SkmD_y13DBzNljGTDxhoLZJsUPhabdtm20_aTd0lkmGQ_6DuRrEizidGWLEHrPeCzBzSlK6Oiuz8jXjXPBFL-m4gdDsOarMvzpjdBZOoVAlhDO8TbaBZv25FD69hSTctl9_XuJicqISMqmSVPa3aHUMrq2A',
  },
];

const InstructorMedia = () => {
  const [files, setFiles] = useState<MediaFile[]>(mockFiles);
  const [selectedIdx, setSelectedIdx] = useState(1); // Default to Huong_Dan_Go_Nhip_Phach.mp4

  const activeFile = files[selectedIdx];

  const handleDownload = (name: string) => {
    alert(`Bắt đầu tải xuống tệp: ${name}`);
  };

  const handleDelete = (index: number) => {
    if (confirm(`Bạn có chắc chắn muốn xóa tệp: ${files[index].name}?`)) {
      const nextFiles = files.filter((_, idx) => idx !== index);
      setFiles(nextFiles);
      setSelectedIdx(0);
    }
  };

  const handleUploadClick = () => {
    alert('Kích hoạt hộp thoại chọn file tải lên hệ thống...');
  };

  const handleCreateFolder = () => {
    const name = prompt('Nhập tên thư mục mới:');
    if (name) {
      alert(`Đã tạo thành công thư mục "${name}"`);
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
        {/* Left & Center Content: Library Explorer */}
        <div className="lg:col-span-8 space-y-xl">
          {/* Header Actions */}
          <div className="flex justify-between items-end gap-md">
            <div>
              <h2 className="text-headline-md font-bold text-primary">
                Thư viện Media
              </h2>
              <p className="text-on-surface-variant font-body-md text-[14px]">
                Quản lý và tổ chức tài liệu giảng dạy của bạn
              </p>
            </div>
            <button
              onClick={handleCreateFolder}
              className="bg-primary text-on-primary px-lg py-sm rounded-lg font-label-md flex items-center gap-sm shadow-md hover:opacity-90 transition-all active:scale-95"
            >
              <Plus className="w-4 h-4 text-white" />
              Tạo thư mục mới
            </button>
          </div>

          {/* Folders Bento Grid */}
          <section>
            <h3 className="font-label-md text-label-md text-on-surface-variant mb-md uppercase tracking-wider text-xs font-semibold">
              Thư mục chính
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-md">
              {/* Folder 1 */}
              <div
                onClick={() => alert('Đang mở thư mục Âm thanh chuẩn')}
                className="bg-white p-lg rounded-xl border border-outline-variant/10 shadow-sm hover:shadow-md transition-shadow group cursor-pointer"
              >
                <div className="flex justify-between items-start mb-md">
                  <Folder className="w-10 h-10 text-primary fill-primary" />
                  <button className="text-on-surface-variant opacity-0 group-hover:opacity-100 transition-opacity">
                    <MoreVertical className="w-5 h-5" />
                  </button>
                </div>
                <h4 className="font-headline-md text-label-md text-primary font-bold">
                  Âm thanh chuẩn
                </h4>
                <p className="text-on-surface-variant text-label-sm mt-1 text-[12px]">
                  42 tệp • 450 MB
                </p>
              </div>

              {/* Folder 2 */}
              <div
                onClick={() => alert('Đang mở thư mục Video thị phạm')}
                className="bg-white p-lg rounded-xl border border-outline-variant/10 shadow-sm hover:shadow-md transition-shadow group cursor-pointer"
              >
                <div className="flex justify-between items-start mb-md">
                  <Video className="w-10 h-10 text-primary fill-primary" />
                  <button className="text-on-surface-variant opacity-0 group-hover:opacity-100 transition-opacity">
                    <MoreVertical className="w-5 h-5" />
                  </button>
                </div>
                <h4 className="font-headline-md text-label-md text-primary font-bold">
                  Video thị phạm
                </h4>
                <p className="text-on-surface-variant text-label-sm mt-1 text-[12px]">
                  12 tệp • 1.1 GB
                </p>
              </div>

              {/* Folder 3 */}
              <div
                onClick={() => alert('Đang mở thư mục Hình ảnh hướng dẫn')}
                className="bg-white p-lg rounded-xl border border-outline-variant/10 shadow-sm hover:shadow-md transition-shadow group cursor-pointer"
              >
                <div className="flex justify-between items-start mb-md">
                  <Image className="w-10 h-10 text-primary fill-primary" />
                  <button className="text-on-surface-variant opacity-0 group-hover:opacity-100 transition-opacity">
                    <MoreVertical className="w-5 h-5" />
                  </button>
                </div>
                <h4 className="font-headline-md text-label-md text-primary font-bold">
                  Hình ảnh hướng dẫn
                </h4>
                <p className="text-on-surface-variant text-label-sm mt-1 text-[12px]">
                  85 tệp • 120 MB
                </p>
              </div>
            </div>
          </section>

          {/* Drag & Drop Zone */}
          <section className="relative">
            <div
              onClick={handleUploadClick}
              className="border-2 border-dashed border-outline-variant/30 rounded-2xl p-xl bg-[#f5f3ee] flex flex-col items-center justify-center text-center group hover:border-[#735c00] transition-colors cursor-pointer"
            >
              <div className="w-16 h-16 bg-[#735c00]/10 rounded-full flex items-center justify-center mb-md group-hover:scale-110 transition-transform">
                <UploadCloud className="w-8 h-8 text-[#735c00]" />
              </div>
              <h3 className="text-headline-md font-semibold mb-xs text-on-surface">
                Kéo và thả tệp tin vào đây
              </h3>
              <p className="text-on-surface-variant font-body-md max-w-md text-[14px]">
                Tải lên các bản ghi âm, video bài giảng hoặc tài liệu nhạc phổ
                (Hỗ trợ MP3, MP4, PDF, PNG)
              </p>
              <button className="mt-lg px-xl py-md border border-[#735c00] text-[#735c00] rounded-lg font-label-md hover:bg-[#735c00]/5 transition-colors">
                Chọn tệp từ máy tính
              </button>
            </div>
          </section>

          {/* Recent Files Table */}
          <section>
            <div className="flex items-center justify-between mb-md">
              <h3 className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider text-xs font-semibold">
                Tệp tin gần đây
              </h3>
              <button
                onClick={() => alert('Xem danh sách tất cả các tệp')}
                className="text-secondary font-label-md hover:underline font-semibold"
              >
                Xem tất cả
              </button>
            </div>

            <div className="bg-white rounded-xl border border-outline-variant/10 overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#f5f3ee] border-b border-outline-variant/10">
                    <th className="px-lg py-md font-label-sm text-on-surface-variant uppercase text-xs">
                      Tên tệp
                    </th>
                    <th className="px-lg py-md font-label-sm text-on-surface-variant uppercase text-xs">
                      Ngày tải
                    </th>
                    <th className="px-lg py-md font-label-sm text-on-surface-variant uppercase text-xs">
                      Dung lượng
                    </th>
                    <th className="px-lg py-md"></th>
                  </tr>
                </thead>
                <tbody>
                  {files.map((file, idx) => {
                    const isSelected = idx === selectedIdx;
                    return (
                      <tr
                        key={file.name}
                        onClick={() => setSelectedIdx(idx)}
                        className={`border-b border-outline-variant/5 hover:bg-[#f5f3ee] transition-colors cursor-pointer ${
                          isSelected ? 'bg-primary/5' : ''
                        }`}
                      >
                        <td className="px-lg py-md flex items-center gap-md">
                          {file.type === 'audio' && (
                            <FileAudio className="w-5 h-5 text-secondary" />
                          )}
                          {file.type === 'video' && (
                            <FileVideo className="w-5 h-5 text-secondary" />
                          )}
                          {file.type === 'image' && (
                            <FileImage className="w-5 h-5 text-secondary" />
                          )}
                          <span
                            className={`font-label-md text-on-surface ${
                              isSelected ? 'font-bold text-primary' : ''
                            }`}
                          >
                            {file.name}
                          </span>
                        </td>
                        <td className="px-lg py-md text-on-surface-variant font-body-md text-[14px]">
                          {file.updatedAt}
                        </td>
                        <td className="px-lg py-md text-on-surface-variant font-body-md text-[14px]">
                          {file.size}
                        </td>
                        <td className="px-lg py-md text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(idx);
                            }}
                            className="text-on-surface-variant hover:text-error transition-colors"
                          >
                            <Trash2 className="w-4 h-4 inline" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        {/* Right Content: File Preview & Stats */}
        <aside className="lg:col-span-4 space-y-lg">
          {/* Preview Panel */}
          {activeFile && (
            <div className="bg-white rounded-2xl border border-outline-variant/10 shadow-sm p-lg sticky top-24">
              <h3 className="font-label-md text-label-md text-on-surface-variant mb-lg uppercase tracking-wider text-xs font-semibold">
                Xem trước tệp
              </h3>

              <div className="bg-[#f5f3ee] rounded-xl aspect-video mb-lg flex items-center justify-center overflow-hidden relative group border border-outline-variant/20">
                {activeFile.thumbnail ? (
                  <img
                    src={activeFile.thumbnail}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-on-surface-variant p-md">
                    <FileAudio className="w-12 h-12 text-[#735c00] mb-2" />
                    <span className="text-[12px] font-semibold">
                      Không hỗ trợ ảnh thu nhỏ
                    </span>
                  </div>
                )}
                {activeFile.type === 'video' && (
                  <div className="absolute inset-0 bg-primary/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                    <div className="bg-primary p-3 rounded-full text-white shadow-lg">
                      <Play className="w-6 h-6 fill-white text-white ml-[3px]" />
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-md">
                <div>
                  <h4 className="font-headline-md text-label-md font-bold text-on-surface truncate">
                    {activeFile.name}
                  </h4>
                  <p className="text-on-surface-variant text-label-sm text-[12px]">
                    Đã tải lên vào {activeFile.updatedAt}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-sm pt-md border-t border-outline-variant/10">
                  <div>
                    <p className="text-label-sm text-on-surface-variant text-[11px]">
                      Định dạng
                    </p>
                    <p className="font-label-md text-on-surface text-[13px] truncate">
                      {activeFile.format}
                    </p>
                  </div>
                  {activeFile.resolution && (
                    <div>
                      <p className="text-label-sm text-on-surface-variant text-[11px]">
                        Độ phân giải
                      </p>
                      <p className="font-label-md text-on-surface text-[13px]">
                        {activeFile.resolution}
                      </p>
                    </div>
                  )}
                  {activeFile.duration && (
                    <div>
                      <p className="text-label-sm text-on-surface-variant text-[11px]">
                        Thời lượng
                      </p>
                      <p className="font-label-md text-on-surface text-[13px]">
                        {activeFile.duration}
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="text-label-sm text-on-surface-variant text-[11px]">
                      Dung lượng
                    </p>
                    <p className="font-label-md text-on-surface text-[13px]">
                      {activeFile.size}
                    </p>
                  </div>
                </div>

                <div className="flex gap-sm pt-lg">
                  <button
                    onClick={() => handleDownload(activeFile.name)}
                    className="flex-1 bg-secondary text-on-secondary py-sm rounded-lg font-label-md flex items-center justify-center gap-xs text-[13px] font-semibold active:scale-95 transition-transform"
                  >
                    <Download className="w-4 h-4" />
                    Tải về
                  </button>
                  <button
                    onClick={() => handleDelete(selectedIdx)}
                    className="p-sm border border-outline-variant/30 rounded-lg text-on-surface-variant hover:bg-error/5 hover:text-error transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Usage Statistics in Preview Side */}
              <div className="mt-xl pt-xl border-t border-outline-variant/10">
                <h3 className="font-label-md text-label-md text-on-surface-variant mb-md uppercase tracking-wider text-xs font-semibold">
                  Tình trạng bộ nhớ
                </h3>
                <div className="flex justify-between items-end mb-xs">
                  <span className="text-3xl font-bold text-primary leading-none">
                    24<span className="text-xl">%</span>
                  </span>
                  <span className="text-label-sm text-on-surface-variant mb-1 text-[12px]">
                    1.2GB dùng trên 5GB
                  </span>
                </div>
                <div className="w-full bg-[#eae8e3] h-2 rounded-full overflow-hidden">
                  <div className="bg-primary h-full w-[24%] rounded-full shadow-[0_0_8px_rgba(97,0,0,0.3)]" />
                </div>
                <div className="mt-md flex flex-col gap-xs">
                  <div className="flex items-center gap-sm">
                    <div className="w-3 h-3 rounded-full bg-primary" />
                    <p className="text-label-sm text-on-surface-variant flex-grow text-[12px]">
                      Video bài giảng
                    </p>
                    <p className="text-label-sm font-bold text-[12px]">1.1 GB</p>
                  </div>
                  <div className="flex items-center gap-sm">
                    <div className="w-3 h-3 rounded-full bg-secondary" />
                    <p className="text-label-sm text-on-surface-variant flex-grow text-[12px]">
                      Âm thanh mẫu
                    </p>
                    <p className="text-label-sm font-bold text-[12px]">0.4 GB</p>
                  </div>
                  <div className="flex items-center gap-sm">
                    <div className="w-3 h-3 rounded-full bg-[#324456]" />
                    <p className="text-label-sm text-on-surface-variant flex-grow text-[12px]">
                      Hình ảnh &amp; Khác
                    </p>
                    <p className="text-label-sm font-bold text-[12px]">0.1 GB</p>
                  </div>
                </div>
                <button
                  onClick={() => alert('Chuyển sang trang nâng cấp dung lượng lưu trữ')}
                  className="w-full mt-lg py-sm border border-outline text-outline rounded-lg font-label-md hover:bg-[#e4e2dd] transition-colors text-[13px] font-semibold active:scale-95"
                >
                  Nâng cấp dung lượng
                </button>
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
};

export default InstructorMedia;
