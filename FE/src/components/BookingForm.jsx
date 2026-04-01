import React, { useEffect, useState } from 'react';
import { Button } from './ui/Button';

const STATUS_OPTIONS = ['Pending', 'Confirmed', 'Cancelled', 'Expired'];

const normalizeId = (value) => {
  if (!value) return '';
  if (typeof value === 'string') return value;
  return value.id || value._id || '';
};

const toDateInput = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().split('T')[0];
};

export default function BookingForm({
  onSubmit,
  onCancel,
  initialData,
  users = [],
  courts = [],
  slots = [],
  vouchers = [],
}) {
  const [formData, setFormData] = useState({
    userId: '',
    courtId: '',
    slotId: '',
    bookingDate: '',
    voucherId: '',
    status: 'Pending',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    if (!initialData) return;
    setFormData({
      userId: normalizeId(initialData.userId),
      courtId: normalizeId(initialData.courtId),
      slotId: normalizeId(initialData.slotId),
      bookingDate: toDateInput(initialData.bookingDate),
      voucherId: normalizeId(initialData.voucherId),
      status: initialData.status || 'Pending',
    });
  }, [initialData]);

  const setFieldErrorFromDetails = (details = []) => {
    const nextErrors = {};
    for (const detail of details) {
      const path = Array.isArray(detail.path) ? detail.path : [];
      const field = path[path.length - 1];
      if (field) {
        nextErrors[field] = detail.message;
      }
    }
    setFieldErrors(nextErrors);
  };

  const validateClientSide = () => {
    const requiredFields = ['courtId', 'slotId', 'bookingDate'];

    const nextErrors = {};
    for (const field of requiredFields) {
      if (!formData[field]) {
        nextErrors[field] = 'Truong nay la bat buoc';
      }
    }

    if (formData.bookingDate) {
      const isValidFormat = /^\d{4}-\d{2}-\d{2}$/.test(formData.bookingDate);
      if (!isValidFormat) {
        nextErrors.bookingDate = 'Ngay dat phai dung dinh dang YYYY-MM-DD';
      }
    }

    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (fieldErrors[name]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage('');

    if (!validateClientSide()) {
      return;
    }

    const payload = {
      courtId: formData.courtId,
      slotId: formData.slotId,
      bookingDate: formData.bookingDate,
      voucherId: formData.voucherId || null,
    };

    if (!initialData && formData.userId) {
      payload.userId = formData.userId;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(payload);
    } catch (error) {
      if (Array.isArray(error?.details) && error.details.length > 0) {
        setFieldErrorFromDetails(error.details);
      } else {
        setErrorMessage(error?.message || 'Khong the luu booking');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <aside className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" aria-modal="true" role="dialog">
      <section className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <header className="p-8 border-b border-slate-100 flex justify-between items-center">
          <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">
            {initialData ? 'Cap Nhat Booking' : 'Tao Booking Moi'}
          </h3>
          <button
            type="button"
            onClick={onCancel}
            className="text-[10px] font-black text-slate-400 hover:text-slate-900 tracking-widest uppercase"
          >
            Dong
          </button>
        </header>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {errorMessage ? (
            <div className="p-4 bg-red-50 rounded-xl border border-red-100">
              <p className="text-[10px] font-black text-red-600 uppercase tracking-widest leading-none">Loi he thong</p>
              <p className="text-xs font-bold text-red-500 mt-1">{errorMessage}</p>
            </div>
          ) : null}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nguoi Dat (Tuy Chon)</label>
              <select
                name="userId"
                value={formData.userId}
                onChange={handleChange}
                disabled={!!initialData}
                className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 font-bold text-xs"
              >
                <option value="">-- Chon nguoi dat --</option>
                {users.map((user) => (
                  <option key={normalizeId(user)} value={normalizeId(user)}>
                    {user.fullName || user.email || user.phoneNumber || normalizeId(user)}
                  </option>
                ))}
              </select>
              {fieldErrors.userId ? <p className="text-[10px] font-black text-red-500 uppercase">{fieldErrors.userId}</p> : null}
              <p className="text-[10px] font-bold text-slate-400 uppercase">Neu de trong, BE se dung user tu token dang nhap</p>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Trang Thai</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                disabled
                className="w-full px-4 py-3 rounded-xl bg-slate-100 border border-slate-100 font-bold text-xs text-slate-500"
              >
                {STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Trang thai duoc doi bang nut DUYET / HUY trong danh sach</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">San</label>
              <select
                name="courtId"
                value={formData.courtId}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 font-bold text-xs"
              >
                <option value="">-- Chon san --</option>
                {courts.map((court) => (
                  <option key={normalizeId(court)} value={normalizeId(court)}>
                    {court.courtName || normalizeId(court)}
                  </option>
                ))}
              </select>
              {fieldErrors.courtId ? <p className="text-[10px] font-black text-red-500 uppercase">{fieldErrors.courtId}</p> : null}
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Khung Gio</label>
              <select
                name="slotId"
                value={formData.slotId}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 font-bold text-xs"
              >
                <option value="">-- Chon khung gio --</option>
                {slots.map((slot) => {
                  const id = normalizeId(slot);
                  const label = slot.startTime && slot.endTime
                    ? `${slot.startTime} - ${slot.endTime} (${Number(slot.price || 0).toLocaleString()} VND)`
                    : id;
                  return (
                    <option key={id} value={id}>
                      {label}
                    </option>
                  );
                })}
              </select>
              {fieldErrors.slotId ? <p className="text-[10px] font-black text-red-500 uppercase">{fieldErrors.slotId}</p> : null}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ngay Dat</label>
              <input
                type="date"
                name="bookingDate"
                value={formData.bookingDate}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 font-bold text-xs"
              />
              {fieldErrors.bookingDate ? <p className="text-[10px] font-black text-red-500 uppercase">{fieldErrors.bookingDate}</p> : null}
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Voucher (Tuy Chon)</label>
              <select
                name="voucherId"
                value={formData.voucherId}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 font-bold text-xs"
              >
                <option value="">-- Khong ap dung voucher --</option>
                {vouchers.map((voucher) => (
                  <option key={normalizeId(voucher)} value={normalizeId(voucher)}>
                    {voucher.voucherCode || normalizeId(voucher)}
                  </option>
                ))}
              </select>
              {fieldErrors.voucherId ? <p className="text-[10px] font-black text-red-500 uppercase">{fieldErrors.voucherId}</p> : null}
            </div>
          </div>

          <nav className="pt-4 flex gap-4">
            <Button type="button" variant="secondary" onClick={onCancel} className="flex-1 uppercase text-[10px] tracking-widest">
              Huy Bo
            </Button>
            <Button type="submit" isLoading={isSubmitting} className="flex-1 uppercase text-[10px] tracking-widest">
              {initialData ? 'Luu Thay Doi' : 'Tao Booking'}
            </Button>
          </nav>
        </form>
      </section>
    </aside>
  );
}
