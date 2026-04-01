import React, { useMemo, useState } from 'react';
import { Button } from './ui/Button';
import { useRoles } from '../hooks/useRoles';

const normalizeId = (value) => {
  if (!value) return '';
  if (typeof value === 'string') return value;
  return value.id || value._id || '';
};

export default function UserForm({ onSubmit, initialData, onCancel }) {
  const { data: rolesData } = useRoles();
  const roles = useMemo(() => rolesData?.items || [], [rolesData]);

  const [formData, setFormData] = useState({
    fullName: initialData?.fullName || '',
    phoneNumber: initialData?.phoneNumber || '',
    email: initialData?.email || '',
    password: '',
    roleId: normalizeId(initialData?.roleId) || '',
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
      const payload = {
        fullName: formData.fullName,
        phoneNumber: formData.phoneNumber,
        email: formData.email || undefined,
        roleId: formData.roleId,
      };

      if (formData.password) {
        payload.password = formData.password;
      }

      await onSubmit(payload);
    } catch (error) {
      setErrorMessage(error?.message || 'Khong the luu nguoi dung');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/20 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col">
        <header className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">
              {initialData ? 'CAP NHAT NGUOI DUNG' : 'TAO NGUOI DUNG'}
            </h2>
            <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">
              THONG TIN TAI KHOAN VA PHAN QUYEN
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Ho Ten *</label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                required
                className="w-full bg-slate-50 border-0 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">So Dien Thoai *</label>
              <input
                type="tel"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                required
                className="w-full bg-slate-50 border-0 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full bg-slate-50 border-0 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                {initialData ? 'Mat Khau Moi (Tuy Chon)' : 'Mat Khau *'}
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required={!initialData}
                className="w-full bg-slate-50 border-0 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Nhom Quyen *</label>
            <select
              name="roleId"
              value={formData.roleId}
              onChange={handleChange}
              required
              className="w-full bg-slate-50 border-0 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-teal-500 uppercase"
            >
              <option value="" disabled>
                --- CHON QUYEN ---
              </option>
              {roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.roleName}
                </option>
              ))}
            </select>
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
              {initialData ? 'CAP NHAT' : 'TAO NGUOI DUNG'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
