import { useState, useEffect, useRef, useCallback, type ChangeEvent } from 'react';
import {
  Folder,
  Video,
  Image,
  UploadCloud,
  FileAudio,
  FileVideo,
  FileImage,
  Download,
  Trash2,
  Play,
  Check,
} from 'lucide-react';
import { useAxiosRequest } from '../../hooks/useAxiosRequest';
import { lessonsApi, lessonAssetsApi } from '../../api/services';
import type { Lesson, LessonAsset } from '../../api/types';

const InstructorMedia = () => {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [selectedLessonId, setSelectedLessonId] = useState<number | ''>('');
  const [selectedFolderType, setSelectedFolderType] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 1. Fetch lessons list
  const fetchLessons = useCallback((signal?: AbortSignal) => {
    return lessonsApi.list(new URLSearchParams({ size: '100' }), { signal });
  }, []);

  const { data: lessonsResponse, loading: lessonsLoading } = useAxiosRequest(
    fetchLessons,
    { auto: true }
  );

  const lessons: Lesson[] = lessonsResponse?.content || [];

  // 2. Fetch assets for selected lesson
  const fetchAssets = useCallback((signal?: AbortSignal) => {
    if (!selectedLessonId) return Promise.resolve([] as LessonAsset[]);
    return lessonAssetsApi.getAssets(Number(selectedLessonId), { signal });
  }, [selectedLessonId]);

  const {
    data: assets,
    loading: assetsLoading,
    execute: refetchAssets
  } = useAxiosRequest(fetchAssets, { auto: false });

  useEffect(() => {
    if (selectedLessonId) {
      refetchAssets();
    }
  }, [selectedLessonId, refetchAssets]);

  // Derived assets list with category filter
  const allAssets = assets || [];
  const files = allAssets.filter(file => {
    const fileType = file.type || (file as any).assetType || '';
    if (selectedFolderType) {
      return fileType.toLowerCase() === selectedFolderType.toLowerCase();
    }
    return true;
  });

  const activeFile = files[selectedIdx] || null;

  // Folder categories acting as type filters
  const folders = [
    {
      id: 'f-1',
      name: 'Âm thanh mẫu',
      count: allAssets.filter(f => (f.type || (f as any).assetType || '').toLowerCase() === 'audio').length,
      size: 'Audio',
      type: 'audio',
      description: 'Bản ghi âm nhạc cụ mẫu',
      color: '#8b0000',
    },
    {
      id: 'f-2',
      name: 'Video thị phạm',
      count: allAssets.filter(f => (f.type || (f as any).assetType || '').toLowerCase() === 'video').length,
      size: 'Video',
      type: 'video',
      description: 'Video giảng viên thị phạm biểu diễn',
      color: '#cca730',
    },
    {
      id: 'f-3',
      name: 'Hình ảnh & Tài liệu',
      count: allAssets.filter(f => (f.type || (f as any).assetType || '').toLowerCase() === 'image').length,
      size: 'Image',
      type: 'image',
      description: 'Hình ảnh hướng dẫn tư thế, nhạc phổ',
      color: '#1b5e20',
    },
  ];

  const handleDownload = (url: string) => {
    if (!url) return;
    window.open(url, '_blank');
  };

  const handleDelete = async (index: number) => {
    if (!selectedLessonId) return;
    const file = files[index];
    if (!file) return;
    if (confirm(`Bạn có chắc chắn muốn xóa tệp này?`)) {
      try {
        await lessonAssetsApi.deleteAsset(Number(selectedLessonId), file.id);
        alert('Xóa tệp tin thành công!');
        refetchAssets();
        setSelectedIdx(0);
      } catch (err: any) {
        alert(err.message || 'Lỗi khi xóa tệp tin');
      }
    }
  };

  const handleUploadClick = () => {
    if (!selectedLessonId) {
      alert('Vui lòng chọn bài học trước khi tải lên.');
      return;
    }
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedLessonId) return;

    const lowerName = file.name.toLowerCase();
    const type = lowerName.endsWith('.mp4') ? 'video' : (lowerName.endsWith('.png') || lowerName.endsWith('.jpg') || lowerName.endsWith('.jpeg')) ? 'image' : 'audio';

    setIsUploading(true);
    try {
      await lessonAssetsApi.uploadAsset(Number(selectedLessonId), file, type);
      alert('Tải lên tệp tin thành công!');
      refetchAssets();
    } catch (error: any) {
      alert(error.message || 'Lỗi tải lên tệp tin');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const renderFolderIcon = (type: string, color?: string) => {
    const iconStyle = { color: color || '#8b0000', fill: color ? `${color}20` : '#8b000020' };
    switch (type) {
      case 'video':
        return <Video className="w-10 h-10" style={iconStyle} />;
      case 'image':
        return <Image className="w-10 h-10" style={iconStyle} />;
      default:
        return <Folder className="w-10 h-10" style={iconStyle} />;
    }
  };

  // Helper mappings for displaying UI properties from LessonAsset response
  const getFileUrl = (file: LessonAsset) => {
    return file.url || (file as any).assetUrl || '';
  };

  const getFileName = (file: LessonAsset) => {
    const url = getFileUrl(file);
    return url.split('/').pop() || 'Chưa đặt tên';
  };

  const getFileFormat = (file: LessonAsset) => {
    const url = getFileUrl(file);
    const ext = url.split('.').pop()?.toUpperCase() || 'UNKNOWN';
    const type = file.type || (file as any).assetType || 'other';
    return `${ext} (${type.toUpperCase()})`;
  };

  const getFileDuration = (file: LessonAsset) => {
    const duration = file.duration_sec || (file as any).durationSec;
    if (!duration) return undefined;
    const mins = Math.floor(duration / 60);
    const secs = duration % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getFileThumbnail = (file: LessonAsset) => {
    const type = file.type || (file as any).assetType || 'other';
    const url = getFileUrl(file);
    if (type.toLowerCase() === 'image') return url;
    return null;
  };

  return (
    <div className="max-w-[1400px] mx-auto">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept=".mp3,.wav,.mp4,.png,.jpg,.jpeg,.pdf"
      />

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
            
            <div className="flex items-center gap-md">
              <div className="flex flex-col gap-[2px]">
                <label className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">Chọn Bài học</label>
                {lessonsLoading ? (
                  <div className="text-label-sm text-on-surface-variant">Đang tải bài học...</div>
                ) : (
                  <select
                    value={selectedLessonId}
                    onChange={(e) => {
                      setSelectedLessonId(e.target.value ? Number(e.target.value) : '');
                      setSelectedIdx(0);
                    }}
                    className="bg-white border border-outline-variant/30 rounded-lg p-2 font-body-md outline-none text-on-surface min-w-[200px] shadow-xs cursor-pointer"
                  >
                    <option value="">-- Chọn bài học --</option>
                    {lessons.map((lesson) => (
                      <option key={lesson.id} value={lesson.id}>
                        {lesson.title}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>
          </div>

          {/* Folders Bento Grid */}
          <section>
            <h3 className="font-label-md text-label-md text-on-surface-variant mb-md uppercase tracking-wider text-xs font-semibold">
              Bộ lọc loại tài liệu
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-md">
              {folders.map((folder) => {
                const isSelected = selectedFolderType === folder.type;
                return (
                  <div
                    key={folder.id}
                    onClick={() => {
                      setSelectedFolderType(isSelected ? null : folder.type);
                      setSelectedIdx(0);
                    }}
                    className={`bg-white p-lg rounded-xl border shadow-sm hover:shadow-md transition-all group cursor-pointer ${
                      isSelected ? 'border-primary ring-2 ring-primary/20' : 'border-outline-variant/10'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-md">
                      {renderFolderIcon(folder.type, folder.color)}
                      {isSelected && (
                        <Check className="w-5 h-5 text-primary" />
                      )}
                    </div>
                    <h4 className="font-headline-md text-label-md text-primary font-bold">
                      {folder.name}
                    </h4>
                    <p className="text-on-surface-variant text-label-sm mt-1 text-[12px]">
                      {folder.count} tệp • {folder.size}
                    </p>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Drag & Drop Zone */}
          <section className="relative">
            <div
              onClick={handleUploadClick}
              className={`border-2 border-dashed border-outline-variant/30 rounded-2xl p-xl bg-[#f5f3ee] flex flex-col items-center justify-center text-center group hover:border-[#735c00] transition-colors cursor-pointer ${
                isUploading ? 'opacity-50 pointer-events-none' : ''
              }`}
            >
              <div className="w-16 h-16 bg-[#735c00]/10 rounded-full flex items-center justify-center mb-md group-hover:scale-110 transition-transform">
                <UploadCloud className="w-8 h-8 text-[#735c00]" />
              </div>
              <h3 className="text-headline-md font-semibold mb-xs text-on-surface">
                {isUploading ? 'Đang tải lên tệp tin...' : 'Tải lên tệp tin bài giảng'}
              </h3>
              <p className="text-on-surface-variant font-body-md max-w-md text-[14px]">
                {!selectedLessonId 
                  ? 'Vui lòng chọn một bài học ở trên trước khi tải lên.'
                  : 'Hỗ trợ định dạng âm thanh mẫu (MP3, WAV), video thị phạm (MP4) hoặc nhạc phổ (PDF, PNG)'
                }
              </p>
              <button 
                disabled={!selectedLessonId}
                className="mt-lg px-xl py-md border border-[#735c00] text-[#735c00] rounded-lg font-label-md hover:bg-[#735c00]/5 transition-colors disabled:opacity-50"
              >
                Chọn tệp từ máy tính
              </button>
            </div>
          </section>

          {/* Recent Files Table */}
          <section>
            <div className="flex items-center justify-between mb-md">
              <h3 className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider text-xs font-semibold">
                Danh sách tệp tin {selectedFolderType ? `(${folders.find(f => f.type === selectedFolderType)?.name})` : ''}
              </h3>
            </div>

            <div className="bg-white rounded-xl border border-outline-variant/10 overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#f5f3ee] border-b border-outline-variant/10">
                    <th className="px-lg py-md font-label-sm text-on-surface-variant uppercase text-xs">
                      Tên tệp
                    </th>
                    <th className="px-lg py-md font-label-sm text-on-surface-variant uppercase text-xs">
                      Định dạng
                    </th>
                    <th className="px-lg py-md font-label-sm text-on-surface-variant uppercase text-xs">
                      Thời lượng
                    </th>
                    <th className="px-lg py-md"></th>
                  </tr>
                </thead>
                <tbody>
                  {assetsLoading ? (
                    <tr>
                      <td colSpan={4} className="px-lg py-xl text-center text-on-surface-variant">
                        Đang tải danh sách tài nguyên...
                      </td>
                    </tr>
                  ) : !selectedLessonId ? (
                    <tr>
                      <td colSpan={4} className="px-lg py-xl text-center text-on-surface-variant">
                        Vui lòng chọn bài học ở phía trên để hiển thị danh sách tệp tin.
                      </td>
                    </tr>
                  ) : files.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-lg py-xl text-center text-on-surface-variant">
                        Không có tệp tin nào phù hợp với bộ lọc trong bài học này.
                      </td>
                    </tr>
                  ) : (
                    files.map((file, idx) => {
                      const isSelected = idx === selectedIdx;
                      const fileType = file.type || (file as any).assetType || '';
                      return (
                        <tr
                          key={file.id}
                          onClick={() => setSelectedIdx(idx)}
                          className={`border-b border-outline-variant/5 hover:bg-[#f5f3ee] transition-colors cursor-pointer ${
                            isSelected ? 'bg-primary/5' : ''
                          }`}
                        >
                          <td className="px-lg py-md flex items-center gap-md">
                            {fileType.toLowerCase() === 'audio' && (
                              <FileAudio className="w-5 h-5 text-secondary" />
                            )}
                            {fileType.toLowerCase() === 'video' && (
                              <FileVideo className="w-5 h-5 text-secondary" />
                            )}
                            {fileType.toLowerCase() === 'image' && (
                              <FileImage className="w-5 h-5 text-secondary" />
                            )}
                            <span
                              className={`font-label-md text-on-surface truncate max-w-[300px] ${
                                isSelected ? 'font-bold text-primary' : ''
                              }`}
                              title={getFileName(file)}
                            >
                              {getFileName(file)}
                            </span>
                          </td>
                          <td className="px-lg py-md text-on-surface-variant font-body-md text-[14px]">
                            {getFileFormat(file)}
                          </td>
                          <td className="px-lg py-md text-on-surface-variant font-body-md text-[14px]">
                            {getFileDuration(file) || 'N/A'}
                          </td>
                          <td className="px-lg py-md text-right">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(idx);
                              }}
                              className="text-on-surface-variant hover:text-error transition-colors"
                              title="Xóa tệp tin"
                            >
                              <Trash2 className="w-4 h-4 inline" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        {/* Right Content: File Preview & Stats */}
        <aside className="lg:col-span-4 space-y-lg">
          {/* Preview Panel */}
          {activeFile ? (
            <div className="bg-white rounded-2xl border border-outline-variant/10 shadow-sm p-lg sticky top-24">
              <h3 className="font-label-md text-label-md text-on-surface-variant mb-lg uppercase tracking-wider text-xs font-semibold">
                Xem trước tệp
              </h3>

              <div className="bg-[#f5f3ee] rounded-xl aspect-video mb-lg flex items-center justify-center overflow-hidden relative group border border-outline-variant/20">
                {getFileThumbnail(activeFile) ? (
                  <img
                    src={getFileThumbnail(activeFile)!}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-on-surface-variant p-md">
                    {(activeFile.type || (activeFile as any).assetType || '').toLowerCase() === 'video' ? (
                      <FileVideo className="w-12 h-12 text-[#735c00] mb-2" />
                    ) : (
                      <FileAudio className="w-12 h-12 text-[#735c00] mb-2" />
                    )}
                    <span className="text-[12px] font-semibold">
                      Không hỗ trợ ảnh thu nhỏ
                    </span>
                  </div>
                )}
                {(activeFile.type || (activeFile as any).assetType || '').toLowerCase() === 'video' && (
                  <div 
                    className="absolute inset-0 bg-primary/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    onClick={() => handleDownload(getFileUrl(activeFile))}
                  >
                    <div className="bg-primary p-3 rounded-full text-white shadow-lg">
                      <Play className="w-6 h-6 fill-white text-white ml-[3px]" />
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-md">
                <div>
                  <h4 className="font-headline-md text-label-md font-bold text-on-surface truncate" title={getFileName(activeFile)}>
                    {getFileName(activeFile)}
                  </h4>
                  <p className="text-on-surface-variant text-label-sm text-[12px]">
                    Nhấp vào nút tải về hoặc icon xem thử để mở tài nguyên.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-sm pt-md border-t border-outline-variant/10">
                  <div>
                    <p className="text-label-sm text-on-surface-variant text-[11px]">
                      Định dạng
                    </p>
                    <p className="font-label-md text-on-surface text-[13px] truncate">
                      {getFileFormat(activeFile)}
                    </p>
                  </div>
                  {getFileDuration(activeFile) && (
                    <div>
                      <p className="text-label-sm text-on-surface-variant text-[11px]">
                        Thời lượng
                      </p>
                      <p className="font-label-md text-on-surface text-[13px]">
                        {getFileDuration(activeFile)}
                      </p>
                    </div>
                  )}
                  {((activeFile as any).tempoBpm || activeFile.tempo_bpm) && (
                    <div>
                      <p className="text-label-sm text-on-surface-variant text-[11px]">
                        Nhịp độ (BPM)
                      </p>
                      <p className="font-label-md text-on-surface text-[13px]">
                        {(activeFile as any).tempoBpm || activeFile.tempo_bpm}
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex gap-sm pt-lg">
                  <button
                    onClick={() => handleDownload(getFileUrl(activeFile))}
                    className="flex-1 bg-secondary text-on-secondary py-sm rounded-lg font-label-md flex items-center justify-center gap-xs text-[13px] font-semibold active:scale-95 transition-transform"
                  >
                    <Download className="w-4 h-4" />
                    Xem / Tải về
                  </button>
                  <button
                    onClick={() => handleDelete(selectedIdx)}
                    className="p-sm border border-outline-variant/30 rounded-lg text-on-surface-variant hover:bg-error/5 hover:text-error transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-outline-variant/10 shadow-sm p-lg text-center text-on-surface-variant">
              Chọn một tệp để xem chi tiết
            </div>
          )}
        </aside>
      </div>
    </div>
  );
};

export default InstructorMedia;
