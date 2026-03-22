import React, { useState, useEffect } from 'react';
import { Button } from './ui/Button';

export default function VoucherForm({ onSubmit, initialData, onCancel }) {
  const [formData, setFormData] = useState({
    code: '',
    discountType: 'Percentage',
    discountValue: '',
    minBookingValue: '',
    maxDiscountAmount: '',
    startDate: '',
    endDate: '',
    quantity: '',
    isActive: true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorDetails, setErrorDetails] = useState([]);

  useEffect(() => {
    if (initialData) {
      setFormData({
        code: initialData.voucherCode || '',
        discountType: initialData.discountType || 'Percentage',
        discountValue: initialData.discountValue || '',
        minBookingValue: initialData.minOrderValue || '',
        maxDiscountAmount: initialData.maxDiscount || '',
        startDate: initialData.startDate ? new Date(initialData.startDate).toISOString().split('T')[0] : '',
        endDate: initialData.endDate ? new Date(initialData.endDate).toISOString().split('T')[0] : '',
        quantity: initialData.usageLimit || '',
        isActive: initialData.isActive ?? true,
      });
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    // Clear field error on change
    if (errorDetails.length > 0) {
      setErrorDetails((prev) => prev.filter((err) => err.field !== name));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorDetails([]);

    try {
      const payload = {
        voucherCode: formData.code.toUpperCase(),
        discountType: formData.discountType,
        discountValue: Number(formData.discountValue),
        minOrderValue: Number(formData.minBookingValue),
        maxDiscount: formData.maxDiscountAmount ? Number(formData.maxDiscountAmount) : null,
        usageLimit: Number(formData.quantity),
        startDate: formData.startDate,
        endDate: formData.endDate,
        isActive: formData.isActive
      };

      await onSubmit(payload);
    } catch (error) {
      console.error('Submit error:', error);
      if (error?.details) {
        setErrorDetails(error.details);
      } else {
        alert(error.message || 'Có lỗi xảy ra!');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const getFieldError = (fieldName) => {
    return errorDetails.find((err) => err.field === fieldName)?.message;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/20 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        <header className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">
              {initialData ? 'CẬP NHẬT VOUCHER' : 'THÊM VOUCHER MỚI'}
            </h2>
            <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">
              ĐIỀN THÔNG TIN CHI TIẾT
            </p>
          </div>
          <button onClick={onCancel} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-200 text-slate-400 font-bold transition-colors">✕</button>
        </header>

        <form onSubmit={handleSubmit} className="p-8 space-y-6 overflow-y-auto">
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Mã Code *</label>
              <input type="text" name="code" value={formData.code} onChange={handleChange} required className="w-full bg-slate-50 border-0 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-teal-500 uppercase transition-all" placeholder="VD: TET2026" />
              {getFieldError('code') && <p className="text-[10px] font-bold text-red-500 mt-1 uppercase">{getFieldError('code')}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Loại giảm giá</label>
                <select name="discountType" value={formData.discountType} onChange={handleChange} className="w-full bg-slate-50 border-0 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-teal-500 uppercase transition-all">
                  <option value="Percentage">Phần trăm (%)</option>
                  <option value="FixedAmount">Cố định (VND)</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Giá trị giảm *</label>
                <input type="number" name="discountValue" value={formData.discountValue} onChange={handleChange} required min="0" className="w-full bg-slate-50 border-0 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-teal-500" />
                {getFieldError('discountValue') && <p className="text-[10px] font-bold text-red-500 mt-1 uppercase">{getFieldError('discountValue')}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Đơn hàng Tối thiểu (VND) *</label>
                <input type="number" name="minBookingValue" value={formData.minBookingValue} onChange={handleChange} required min="0" className="w-full bg-slate-50 border-0 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-teal-500" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Giảm Tối đa (VND)</label>
                <input type="number" name="maxDiscountAmount" value={formData.maxDiscountAmount} onChange={handleChange} placeholder="Có thể bỏ trống" min="0" className="w-full bg-slate-50 border-0 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-teal-500" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Ngày bắt đầu *</label>
                <input type="date" name="startDate" value={formData.startDate} onChange={handleChange} required className="w-full bg-slate-50 border-0 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-teal-500" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Ngày kết thúc *</label>
                <input type="date" name="endDate" value={formData.endDate} onChange={handleChange} required className="w-full bg-slate-50 border-0 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-teal-500" />
              </div>
            </div>
            
             <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Số lượng *</label>
                  <input type="number" name="quantity" value={formData.quantity} onChange={handleChange} required min="1" className="w-full bg-slate-50 border-0 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-teal-500" />
                </div>
                 <div className="flex items-center gap-3 pt-6">
                  <input type="checkbox" id="isActive" name="isActive" checked={formData.isActive} onChange={handleChange} className="w-5 h-5 text-teal-600 border-slate-300 rounded focus:ring-teal-500 focus:ring-offset-0" />
                  <label htmlFor="isActive" className="text-xs font-black text-slate-900 uppercase">Kính hoạt</label>
                </div>
             </div>
          </div>
          
          <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
            <button type="button" onClick={onCancel} className="px-6 py-3 rounded-xl text-xs font-black text-slate-400 uppercase tracking-widest hover:bg-slate-50 hover:text-slate-600 transition-colors">
              HỦY
            </button>
            <Button type="submit" isLoading={isSubmitting}>
              {initialData ? 'CẬP NHẬT' : 'TẠO VOUCHER'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
