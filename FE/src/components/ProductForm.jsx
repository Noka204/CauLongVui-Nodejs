import React, { useState } from 'react';
import { Button } from './ui/Button';

const PRODUCT_TYPES = ['Food', 'Drink', 'Equipment'];
const PRODUCT_STATUSES = ['Active', 'Inactive'];

const toInputNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export default function ProductForm({ initialData, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    price: String(initialData?.price ?? ''),
    stockQuantity: String(initialData?.stockQuantity ?? 0),
    type: initialData?.type || 'Food',
    status: initialData?.status || 'Active',
    image: initialData?.image || '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errorMessage) setErrorMessage('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');

    try {
      await onSubmit({
        name: formData.name.trim(),
        price: toInputNumber(formData.price, 0),
        stockQuantity: toInputNumber(formData.stockQuantity, 0),
        type: formData.type,
        status: formData.status,
        image: formData.image.trim() || null,
      });
    } catch (error) {
      setErrorMessage(error?.message || 'Khong the luu san pham');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/20 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col">
        <header className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">
              {initialData ? 'CAP NHAT SAN PHAM' : 'TAO SAN PHAM'}
            </h2>
            <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">
              MENU DO AN - NUOC UONG - DUNG CU
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-200 text-slate-400 font-bold transition-colors"
          >
            X
          </button>
        </header>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {errorMessage ? (
            <div className="rounded-xl border border-red-100 bg-red-50 p-3 text-xs font-bold text-red-600">
              {errorMessage}
            </div>
          ) : null}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Ten san pham *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full bg-slate-50 border-0 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Gia ban *</label>
              <input
                type="number"
                min="0"
                step="1000"
                name="price"
                value={formData.price}
                onChange={handleChange}
                required
                className="w-full bg-slate-50 border-0 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Ton kho *</label>
              <input
                type="number"
                min="0"
                step="1"
                name="stockQuantity"
                value={formData.stockQuantity}
                onChange={handleChange}
                required
                className="w-full bg-slate-50 border-0 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Loai *</label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="w-full bg-slate-50 border-0 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-teal-500"
              >
                {PRODUCT_TYPES.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Trang thai *</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full bg-slate-50 border-0 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-teal-500"
              >
                {PRODUCT_STATUSES.map((status) => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Anh URL</label>
              <input
                type="url"
                name="image"
                value={formData.image}
                onChange={handleChange}
                placeholder="https://..."
                className="w-full bg-slate-50 border-0 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-3 rounded-xl text-xs font-black text-slate-400 uppercase tracking-widest hover:bg-slate-50 hover:text-slate-600 transition-colors"
            >
              HUY
            </button>
            <Button type="submit" isLoading={isSubmitting}>
              {initialData ? 'CAP NHAT' : 'TAO SAN PHAM'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
