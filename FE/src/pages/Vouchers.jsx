import React, { useState } from 'react';
import { useVouchers, useCreateVoucher, useUpdateVoucher, useDeleteVoucher } from '../hooks/useVouchers';
import { Button } from '../components/ui/Button';
import VoucherForm from '../components/VoucherForm';

export default function Vouchers() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState(null);

  const { data, isLoading, isError } = useVouchers();
  
  const createMutation = useCreateVoucher({
    onSuccess: () => handleCloseForm(),
  });
  
  const updateMutation = useUpdateVoucher({
    onSuccess: () => handleCloseForm(),
  });
  
  const deleteMutation = useDeleteVoucher();

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingVoucher(null);
  };

  const handleEdit = (voucher) => {
    setEditingVoucher(voucher);
    setIsFormOpen(true);
  };

  const handleSubmit = async (formData) => {
    if (editingVoucher) {
      return updateMutation.mutateAsync({ id: editingVoucher.id, data: formData });
    } else {
      return createMutation.mutateAsync(formData);
    }
  };

  if (isLoading) return <div className="text-xs font-black uppercase text-slate-400 p-8">ĐANG TẢI DỮ LIỆU...</div>;
  if (isError) return <div className="text-xs font-black uppercase text-red-500 p-8">LỖI TẢI DỮ LIỆU</div>;

  const vouchers = data?.items || [];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex justify-between items-end">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-black tracking-tight text-slate-900 uppercase">Quản lý Voucher</h1>
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">MÃ GIẢM GIÁ & KHUYẾN MÃI</p>
        </div>
        <Button onClick={() => setIsFormOpen(true)} aria-label="Thêm Voucher mới">THÊM MỚI</Button>
      </header>

      <section className="bento-card overflow-hidden !p-0">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-100">
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Mã CODE</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Giảm giá</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Trạng thái</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {vouchers.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-[10px] font-black text-slate-300 uppercase italic">Chưa có voucher nào</td>
              </tr>
            ) : vouchers.map((v) => (
              <tr key={v.id} className="hover:bg-slate-50/30 transition-colors group">
                <td className="px-6 py-4">
                  <p className="text-xs font-black text-slate-900 uppercase tracking-tight">{v.voucherCode}</p>
                </td>
                <td className="px-6 py-4">
                  <p className="text-xs font-bold text-slate-900">{v.discountType === 'Percentage' ? `${v.discountValue}%` : `${v.discountValue.toLocaleString()} VND`}</p>
                  <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase">ĐK: ≥ {v.minOrderValue?.toLocaleString()} VND</p>
                </td>
                <td className="px-6 py-4 text-center">
                  <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-tighter ${v.isActive ? 'bg-teal-50 text-teal-600' : 'bg-red-50 text-red-600'}`}>
                    {v.isActive ? '● ĐANG CHẠY' : '● TẠM DỪNG'}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <nav className="flex justify-end items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button type="button" onClick={() => handleEdit(v)} className="text-[10px] font-black text-slate-400 hover:text-teal-600 uppercase tracking-widest">SỬA</button>
                    <span className="text-slate-200 text-xs">|</span>
                    <button type="button" onClick={() => { if(confirm('XÁC NHẬN XÓA?')) deleteMutation.mutate(v.id) }} className="text-[10px] font-black text-slate-400 hover:text-red-500 uppercase tracking-widest">XÓA</button>
                  </nav>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {isFormOpen && (
        <VoucherForm 
          onSubmit={handleSubmit}
          initialData={editingVoucher}
          onCancel={handleCloseForm}
        />
      )}
    </div>
  );
}
