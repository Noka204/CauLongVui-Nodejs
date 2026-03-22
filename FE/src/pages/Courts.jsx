import React, { useState } from 'react';
import { useCourts, useCreateCourt, useUpdateCourt, useDeleteCourt } from '../hooks/useCourts';
import { Button } from '../components/ui/Button';
import CourtForm from '../components/CourtForm';

export default function Courts() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCourt, setEditingCourt] = useState(null);
  const [viewMode, setViewMode] = useState('table'); // 'table' hoặc 'grid'

  const { data, isLoading, isError } = useCourts();

  const createMutation = useCreateCourt({
    onSuccess: () => handleCloseForm(),
  });

  const updateMutation = useUpdateCourt({
    onSuccess: () => handleCloseForm(),
  });

  const deleteMutation = useDeleteCourt();

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingCourt(null);
  };

  const handleEdit = (court) => {
    setEditingCourt(court);
    setIsFormOpen(true);
  };

  /**
   * Xử lý submit form — trả về Promise để CourtForm có thể bắt lỗi validation.
   * @param {object} formData
   */
  const handleSubmit = async (formData) => {
    if (editingCourt) {
      return updateMutation.mutateAsync({ id: editingCourt.id, data: formData });
    } else {
      return createMutation.mutateAsync(formData);
    }
  };

  if (isLoading) return <div className="text-xs font-black uppercase text-slate-400 p-8">ĐANG TẢI DỮ LIỆU...</div>;
  if (isError) return <div className="text-xs font-black uppercase text-red-500 p-8">LỖI TẢI DỮ LIỆU</div>;

  const courts = data?.items || [];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex justify-between items-end">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-black tracking-tight text-slate-900 uppercase">Danh sách sân đấu</h1>
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">QUẢN LÝ THÔNG TIN & TRẠNG THÁI SÂN</p>
        </div>
        <div className="flex items-center gap-4">
          {/* Nút chuyển đổi giao diện */}
          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button 
              onClick={() => setViewMode('table')}
              className={clsx(
                "px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all",
                viewMode === 'table' ? "bg-white text-teal-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
              )}
            >
              BẢNG
            </button>
            <button 
              onClick={() => setViewMode('grid')}
              className={clsx(
                "px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all",
                viewMode === 'grid' ? "bg-white text-teal-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
              )}
            >
              LƯỚI
            </button>
          </div>
          <Button onClick={() => setIsFormOpen(true)} aria-label="Thêm sân đấu mới">THÊM SÂN MỚI</Button>
        </div>
      </header>

      {viewMode === 'table' ? (
        <section className="bento-card overflow-hidden !p-0" aria-label="Bảng danh sách sân đấu">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-100">
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Tên Sân</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Mô tả</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Trạng thái</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {courts.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-[10px] font-black text-slate-300 uppercase italic">Chưa có sân đấu nào</td>
              </tr>
            ) : courts.map((court) => (
              <tr key={court.id} className="hover:bg-slate-50/30 transition-colors group">
                <td className="px-6 py-4">
                  <article className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 overflow-hidden flex-shrink-0">
                        {court.imageUrl ? (
                            <img src={`http://localhost:5000${court.imageUrl}`} alt="" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-[10px] font-black text-slate-300 uppercase italic">NO IMG</div>
                        )}
                    </div>
                    <p className="text-xs font-black text-slate-900 uppercase tracking-tight">{court.courtName}</p>
                  </article>
                </td>
                <td className="px-6 py-4">
                  <p className="text-xs font-bold text-slate-400 line-clamp-1 max-w-xs uppercase">{court.description || 'CHƯA CÓ MÔ TẢ'}</p>
                </td>
                <td className="px-6 py-4 text-center">
                  <span className={clsx(
                    "text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-tighter",
                    court.isMaintenance ? "bg-red-50 text-red-600" : "bg-teal-50 text-teal-600"
                  )}>
                    {court.isMaintenance ? '● BẢO TRÌ' : '● HOẠT ĐỘNG'}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <nav className="flex justify-end items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      type="button"
                      onClick={() => handleEdit(court)}
                      aria-label={`Sửa thông tin sân ${court.courtName}`}
                      className="text-[10px] font-black text-slate-400 hover:text-teal-600 uppercase tracking-widest"
                    >
                      SỬA
                    </button>
                    <span className="text-slate-200 text-xs">|</span>
                    <button 
                      type="button"
                      onClick={() => {
                        if(confirm('XÁC NHẬN XÓA SÂN NÀY?')) deleteMutation.mutate(court.id);
                      }}
                      aria-label={`Xóa sân ${court.courtName}`}
                      className="text-[10px] font-black text-slate-400 hover:text-red-500 uppercase tracking-widest"
                    >
                      XÓA
                    </button>
                  </nav>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      ) : (
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courts.length === 0 ? (
            <div className="col-span-full bento-card py-12 text-center text-[10px] font-black text-slate-300 uppercase italic">
              Chưa có sân đấu nào
            </div>
          ) : courts.map((court) => (
            <article key={court.id} className="bento-card group hover:scale-[1.02] transition-transform flex flex-col gap-4">
              <div className="aspect-video rounded-xl bg-slate-100 overflow-hidden relative">
                {court.imageUrl ? (
                  <img src={`http://localhost:5000${court.imageUrl}`} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[10px] font-black text-slate-300 uppercase italic">NO IMAGE</div>
                )}
                <span className={clsx(
                  "absolute top-3 right-3 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-tighter shadow-sm",
                  court.isMaintenance ? "bg-red-500 text-white" : "bg-teal-500 text-white"
                )}>
                  {court.isMaintenance ? 'BẢO TRÌ' : 'HOẠT ĐỘNG'}
                </span>
              </div>
              
              <div className="flex-1 flex flex-col gap-1">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">{court.courtName}</h3>
                <p className="text-[10px] font-bold text-slate-400 line-clamp-2 uppercase leading-relaxed">
                  {court.description || 'CHƯA CÓ MÔ TẢ CHO SÂN ĐẤU NÀY...'}
                </p>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                <button 
                  onClick={() => handleEdit(court)}
                  className="text-[10px] font-black text-teal-600 hover:text-teal-700 uppercase tracking-widest"
                >
                  CHI TIẾT / SỬA
                </button>
                <button 
                  onClick={() => {
                    if(confirm('XÁC NHẬN XÓA SÂN NÀY?')) deleteMutation.mutate(court.id);
                  }}
                  className="text-[10px] font-black text-slate-300 hover:text-red-500 uppercase tracking-widest"
                >
                  XÓA
                </button>
              </div>
            </article>
          ))}
        </section>
      )}

      {isFormOpen && (
        <CourtForm 
          onSubmit={handleSubmit}
          initialData={editingCourt}
          onCancel={handleCloseForm}
        />
      )}
    </div>
  );
}

// Helper clsx for inline use
function clsx(...classes) {
  return classes.filter(Boolean).join(' ');
}
