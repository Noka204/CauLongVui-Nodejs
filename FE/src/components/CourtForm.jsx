import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from './ui/Button';
import UploadZone from './UploadZone';

const schema = z.object({
  courtName: z.string().min(1, 'TÊN SÂN KHÔNG ĐƯỢC ĐỂ TRỐNG').max(100, 'TÊN SÂN KHÔNG ĐƯỢC QUÁ 100 KÝ TỰ'),
  description: z.string().optional(),
  basePrice: z.coerce.number().min(0, 'GIÁ PHẢI LỚN HƠN HOẶC BẰNG 0').default(80000),
  isMaintenance: z.boolean().default(false),
  images: z.any().optional(),
});

export default function CourtForm({ onSubmit, initialData, onCancel }) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: initialData
      ? {
          courtName: initialData.courtName || '',
          description: initialData.description || '',
          basePrice: typeof initialData.basePrice === 'number' ? initialData.basePrice : 80000,
          isMaintenance: !!initialData.isMaintenance,
          images: [],
        }
      : {
          courtName: '',
          description: '',
          basePrice: 80000,
          isMaintenance: false,
          images: [],
        },
  });

  const [globalError, setGlobalError] = useState('');

  const handleImagesChange = (files) => {
    setValue('images', files);
  };

  const onFormSubmit = async (data) => {
    try {
      setGlobalError('');
      await onSubmit(data);
    } catch (err) {
      if (err?.details && Array.isArray(err.details)) {
        err.details.forEach((detail) => {
          const field = detail.path?.[detail.path.length - 1];
          if (field) {
            setError(field, { type: 'manual', message: String(detail.message || '').toUpperCase() });
          }
        });
      } else {
        setGlobalError(String(err?.message || 'LỖI HỆ THỐNG').toUpperCase());
      }
    }
  };

  return (
    <aside className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" aria-modal="true" role="dialog">
      <section className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <header className="p-8 border-b border-slate-100 flex justify-between items-center">
          <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">
            {initialData ? 'CẬP NHẬT SÂN ĐẤU' : 'THÊM SÂN ĐẤU MỚI'}
          </h3>
          <button type="button" onClick={onCancel} className="text-[10px] font-black text-slate-400 hover:text-slate-900 tracking-widest uppercase">
            ĐÓNG
          </button>
        </header>

        <form onSubmit={handleSubmit(onFormSubmit)} className="p-8 space-y-6">
          {globalError ? (
            <div className="p-4 bg-red-50 rounded-xl border border-red-100">
              <p className="text-[10px] font-black text-red-600 uppercase tracking-widest leading-none">LỖI HỆ THỐNG</p>
              <p className="text-xs font-bold text-red-500 mt-1">{globalError}</p>
            </div>
          ) : null}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <section className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tên sân</label>
              <input
                {...register('courtName')}
                placeholder="VD: SAN A1"
                className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 font-bold text-xs uppercase"
              />
              {errors.courtName ? <p className="text-[10px] font-black text-red-500 uppercase">{errors.courtName.message}</p> : null}
            </section>

            <section className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Giá / giờ (VND)</label>
              <input
                type="number"
                min={0}
                step={1000}
                {...register('basePrice')}
                placeholder="VD: 80000"
                className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 font-bold text-xs"
              />
              {errors.basePrice ? <p className="text-[10px] font-black text-red-500 uppercase">{errors.basePrice.message}</p> : null}
            </section>
          </div>

          <section className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Trạng thái</label>
            <nav className="flex gap-4">
              <button
                type="button"
                onClick={() => setValue('isMaintenance', false)}
                className={clsx(
                  'flex-1 py-3 rounded-xl font-black text-[10px] tracking-widest border transition-all',
                  !watch('isMaintenance') ? 'bg-teal-50 border-teal-600 text-teal-600' : 'bg-slate-50 border-slate-100 text-slate-400'
                )}
              >
                ĐANG HOẠT ĐỘNG
              </button>
              <button
                type="button"
                onClick={() => setValue('isMaintenance', true)}
                className={clsx(
                  'flex-1 py-3 rounded-xl font-black text-[10px] tracking-widest border transition-all',
                  watch('isMaintenance') ? 'bg-red-50 border-red-500 text-red-600' : 'bg-slate-50 border-slate-100 text-slate-400'
                )}
              >
                BẢO TRÌ
              </button>
            </nav>
          </section>

          <section className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Mô tả</label>
            <textarea
              {...register('description')}
              rows={3}
              placeholder="THÔNG TIN CHI TIẾT VỀ SÂN ĐẤU..."
              className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 font-bold text-xs uppercase resize-none"
            />
          </section>

          <section className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Hình ảnh</label>
            <UploadZone onChange={handleImagesChange} value={watch('images')} />
          </section>

          <nav className="pt-4 flex gap-4">
            <Button type="button" variant="secondary" onClick={onCancel} className="flex-1 uppercase text-[10px] tracking-widest">
              HỦY BỎ
            </Button>
            <Button type="submit" disabled={isSubmitting} className="flex-1 uppercase text-[10px] tracking-widest">
              {isSubmitting ? 'ĐANG XỬ LÝ...' : initialData ? 'LƯU THAY ĐỔI' : 'TẠO MỚI'}
            </Button>
          </nav>
        </form>
      </section>
    </aside>
  );
}

function clsx(...classes) {
  return classes.filter(Boolean).join(' ');
}
