import React, { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBookings } from '../hooks/useBookings';
import { useCourts } from '../hooks/useCourts';
import { useTimeSlots } from '../hooks/useTimeSlots';

const LIST_PARAMS = { page: 1, limit: 200 };

const normalizeId = (value) => {
  if (!value) return '';
  if (typeof value === 'string') return value;
  return value.id || value._id || '';
};

const formatMoney = (value) => `${Number(value || 0).toLocaleString('vi-VN')} VND`;

const formatDate = (value) => {
  if (!value) return '--';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '--';
  return date.toLocaleDateString('vi-VN');
};

const statusClass = (status) => {
  if (status === 'Confirmed') return 'bg-teal-50 text-teal-700 border-teal-100';
  if (status === 'Cancelled') return 'bg-red-50 text-red-600 border-red-100';
  if (status === 'Expired') return 'bg-slate-100 text-slate-600 border-slate-200';
  return 'bg-amber-50 text-amber-700 border-amber-100';
};

export default function Profile() {
  const navigate = useNavigate();

  const user = useMemo(() => {
    const savedUser = localStorage.getItem('user');
    if (!savedUser) return null;
    try {
      return JSON.parse(savedUser);
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  const bookingsQuery = useBookings(LIST_PARAMS, { enabled: !!user });
  const courtsQuery = useCourts(LIST_PARAMS);
  const slotsQuery = useTimeSlots();

  const bookings = useMemo(() => bookingsQuery.data?.items || [], [bookingsQuery.data]);
  const courts = useMemo(() => courtsQuery.data?.items || [], [courtsQuery.data]);
  const slots = useMemo(() => {
    if (Array.isArray(slotsQuery.data)) return slotsQuery.data;
    return slotsQuery.data?.items || [];
  }, [slotsQuery.data]);

  const courtMap = useMemo(() => {
    return new Map(courts.map((court) => [normalizeId(court.id || court._id), court]));
  }, [courts]);

  const slotMap = useMemo(() => {
    return new Map(slots.map((slot) => [normalizeId(slot.id || slot._id), slot]));
  }, [slots]);

  if (!user) {
    return <div className="min-h-[60vh] flex items-center justify-center">Dang tai...</div>;
  }

  return (
    <div className="min-h-[80vh] flex justify-center bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl w-full space-y-8">
        <div className="bg-white p-10 rounded-3xl shadow-xl shadow-teal-100/50 border border-slate-100 overflow-hidden relative">
          <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-teal-500 to-teal-700" />

          <div className="relative pt-12 flex flex-col items-center">
            <div className="w-32 h-32 bg-white rounded-full p-2 shadow-lg mb-4">
              <img
                src={user.avatar || 'https://ui-avatars.com/api/?name=User&background=random'}
                alt="Avatar"
                className="w-full h-full rounded-full object-cover"
              />
            </div>

            <h2 className="text-3xl font-black text-slate-900 tracking-tight">{user.fullName}</h2>
            <p className="text-teal-600 font-bold mt-1 text-sm uppercase tracking-widest px-3 py-1 bg-teal-50 rounded-full">
              Thanh vien Cau Long Vui
            </p>
          </div>

          <div className="mt-12">
            <h3 className="text-lg font-black text-slate-900 border-b-2 border-slate-100 pb-3 mb-6 uppercase tracking-tight">Thong tin ca nhan</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 hover:border-teal-200 transition-colors">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Email</p>
                <p className="text-slate-900 font-medium text-lg truncate" title={user.email}>{user.email || 'Chua cap nhat'}</p>
              </div>

              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 hover:border-teal-200 transition-colors">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">So dien thoai</p>
                <p className="text-slate-900 font-medium text-lg">{user.phoneNumber || 'Chua cap nhat'}</p>
              </div>

              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 hover:border-teal-200 transition-colors">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">So du tai khoan</p>
                <p className="text-teal-600 font-black text-xl">{Number(user.balance || 0).toLocaleString('vi-VN')} VND</p>
              </div>
            </div>
          </div>
        </div>

        <section className="bg-white p-8 rounded-3xl shadow-xl shadow-teal-100/50 border border-slate-100 space-y-5">
          <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Lich su dat san cua toi</h3>

          {bookingsQuery.isLoading ? (
            <p className="text-sm font-bold text-slate-400">Dang tai booking...</p>
          ) : bookings.length === 0 ? (
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 text-sm font-bold text-slate-500">
              Ban chua co booking nao.
            </div>
          ) : (
            <div className="space-y-3">
              {bookings.map((booking) => {
                const court = courtMap.get(normalizeId(booking.courtId));
                const slot = slotMap.get(normalizeId(booking.slotId));
                const bookingId = normalizeId(booking.id || booking._id);

                return (
                  <article key={bookingId} className="p-5 rounded-2xl border border-slate-100 bg-slate-50 grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Booking</p>
                      <p className="text-sm font-black text-slate-900">#{bookingId.slice(-8)}</p>
                    </div>

                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">San / Gio</p>
                      <p className="text-sm font-black text-slate-900">{court?.courtName || normalizeId(booking.courtId)}</p>
                      <p className="text-xs font-bold text-slate-500 mt-1">{slot ? `${slot.startTime} - ${slot.endTime}` : normalizeId(booking.slotId)}</p>
                    </div>

                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Ngay dat / Tong tien</p>
                      <p className="text-sm font-black text-slate-900">{formatDate(booking.bookingDate)}</p>
                      <p className="text-xs font-bold text-teal-600 mt-1">{formatMoney(booking.totalPrice)}</p>
                    </div>

                    <div className="md:text-right">
                      <span className={`inline-flex px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-widest ${statusClass(booking.status)}`}>
                        {booking.status}
                      </span>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <div className="flex justify-center">
          <button
            className="bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 px-8 rounded-xl shadow-lg transition-all"
            onClick={() => navigate('/')}
          >
            Quay lai trang chu
          </button>
        </div>
      </div>
    </div>
  );
}
