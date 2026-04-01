import React, { useMemo, useState } from 'react';
import {
  useBookings,
  useCreateBooking,
  useDeleteBooking,
  useUpdateBooking,
  useUpdateBookingStatus,
} from '../hooks/useBookings';
import { useCourts } from '../hooks/useCourts';
import { useUsers } from '../hooks/useUsers';
import { useVouchers } from '../hooks/useVouchers';
import { useTimeSlots } from '../hooks/useTimeSlots';
import BookingForm from '../components/BookingForm';
import { Button } from '../components/ui/Button';

const LIST_PARAMS = { page: 1, limit: 200 };
const STATUS_FILTERS = ['All', 'Pending', 'Confirmed', 'Cancelled', 'Expired'];

const normalizeId = (value) => {
  if (!value) return '';
  if (typeof value === 'string') return value;
  return value.id || value._id || '';
};

const formatDate = (value) => {
  if (!value) return '--';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '--';
  return date.toLocaleDateString('vi-VN');
};

const formatMoney = (value) => {
  const amount = Number(value || 0);
  return `${amount.toLocaleString('vi-VN')} VND`;
};

const statusClass = (status) => {
  if (status === 'Confirmed') return 'bg-teal-50 text-teal-700';
  if (status === 'Cancelled') return 'bg-red-50 text-red-600';
  if (status === 'Expired') return 'bg-slate-100 text-slate-600';
  return 'bg-amber-50 text-amber-700';
};

export default function Bookings() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingBooking, setEditingBooking] = useState(null);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const bookingsQuery = useBookings(LIST_PARAMS);
  const usersQuery = useUsers(LIST_PARAMS);
  const courtsQuery = useCourts(LIST_PARAMS);
  const vouchersQuery = useVouchers(LIST_PARAMS);
  const timeSlotsQuery = useTimeSlots();

  const createMutation = useCreateBooking({
    onSuccess: () => handleCloseForm(),
  });

  const updateMutation = useUpdateBooking({
    onSuccess: () => handleCloseForm(),
  });

  const updateStatusMutation = useUpdateBookingStatus();
  const deleteMutation = useDeleteBooking();

  const bookings = useMemo(() => bookingsQuery.data?.items || [], [bookingsQuery.data]);
  const users = useMemo(() => usersQuery.data?.items || [], [usersQuery.data]);
  const courts = useMemo(() => courtsQuery.data?.items || [], [courtsQuery.data]);
  const vouchers = useMemo(() => vouchersQuery.data?.items || [], [vouchersQuery.data]);
  const slots = useMemo(() => {
    if (Array.isArray(timeSlotsQuery.data)) return timeSlotsQuery.data;
    return timeSlotsQuery.data?.items || [];
  }, [timeSlotsQuery.data]);

  const userMap = useMemo(() => {
    return new Map(users.map((user) => [normalizeId(user), user]));
  }, [users]);

  const courtMap = useMemo(() => {
    return new Map(courts.map((court) => [normalizeId(court), court]));
  }, [courts]);

  const slotMap = useMemo(() => {
    return new Map(slots.map((slot) => [normalizeId(slot), slot]));
  }, [slots]);

  const voucherMap = useMemo(() => {
    return new Map(vouchers.map((voucher) => [normalizeId(voucher), voucher]));
  }, [vouchers]);

  const filteredBookings = useMemo(() => {
    const keyword = searchKeyword.trim().toLowerCase();

    return bookings.filter((booking) => {
      const user = userMap.get(normalizeId(booking.userId));
      const court = courtMap.get(normalizeId(booking.courtId));
      const slot = slotMap.get(normalizeId(booking.slotId));

      const statusMatch = statusFilter === 'All' || booking.status === statusFilter;
      if (!statusMatch) return false;

      if (!keyword) return true;

      const searchable = [
        normalizeId(booking.id || booking._id),
        booking.status,
        user?.fullName,
        user?.email,
        user?.phoneNumber,
        court?.courtName,
        slot?.startTime,
        slot?.endTime,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return searchable.includes(keyword);
    });
  }, [bookings, courtMap, searchKeyword, slotMap, statusFilter, userMap]);

  const isLoading =
    bookingsQuery.isLoading ||
    usersQuery.isLoading ||
    courtsQuery.isLoading ||
    vouchersQuery.isLoading ||
    timeSlotsQuery.isLoading;

  const loadError =
    bookingsQuery.error ||
    usersQuery.error ||
    courtsQuery.error ||
    vouchersQuery.error ||
    timeSlotsQuery.error;

  const isMutating =
    createMutation.isPending ||
    updateMutation.isPending ||
    updateStatusMutation.isPending ||
    deleteMutation.isPending;

  function handleCloseForm() {
    setIsFormOpen(false);
    setEditingBooking(null);
  }

  function handleEdit(booking) {
    setEditingBooking(booking);
    setIsFormOpen(true);
  }

  async function handleSubmit(payload) {
    if (editingBooking) {
      return updateMutation.mutateAsync({ id: normalizeId(editingBooking.id || editingBooking._id), data: payload });
    }
    return createMutation.mutateAsync(payload);
  }

  async function handleStatusUpdate(id, status) {
    return updateStatusMutation.mutateAsync({ id, status });
  }

  async function handleDelete(id) {
    const confirmed = window.confirm('Xac nhan huy booking nay?');
    if (!confirmed) return;
    return deleteMutation.mutateAsync(id);
  }

  if (isLoading) {
    return <div className="text-xs font-black uppercase text-slate-400 p-8">Dang tai du lieu booking...</div>;
  }

  if (loadError) {
    return (
      <div className="p-8">
        <p className="text-xs font-black uppercase text-red-500">Khong tai duoc du lieu</p>
        <p className="text-sm font-bold text-slate-500 mt-2">{loadError.message || 'Vui long dang nhap Admin va kiem tra API key.'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col lg:flex-row lg:justify-between lg:items-end gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-black tracking-tight text-slate-900 uppercase">Quan Ly Dat San</h1>
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">
            CRUD BOOKING CUA NGUOI DUNG
          </p>
        </div>
        <Button onClick={() => setIsFormOpen(true)} disabled={isMutating}>
          Tao Booking Moi
        </Button>
      </header>

      <section className="bento-card">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tim kiem nhanh</label>
            <input
              value={searchKeyword}
              onChange={(event) => setSearchKeyword(event.target.value)}
              placeholder="Tim theo ID, nguoi dat, san, khung gio..."
              className="mt-2 w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 font-bold text-xs"
            />
          </div>

          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Loc trang thai</label>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="mt-2 w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 font-bold text-xs"
            >
              {STATUS_FILTERS.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section className="bento-card overflow-hidden !p-0">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-100">
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Booking</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Nguoi Dat</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">San / Khung Gio</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Ngay</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Tong Tien</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Trang Thai</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Thao Tac</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {filteredBookings.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-[10px] font-black text-slate-300 uppercase italic">
                  Khong co booking phu hop bo loc
                </td>
              </tr>
            ) : (
              filteredBookings.map((booking) => {
                const bookingId = normalizeId(booking.id || booking._id);
                const user = userMap.get(normalizeId(booking.userId));
                const court = courtMap.get(normalizeId(booking.courtId));
                const slot = slotMap.get(normalizeId(booking.slotId));
                const voucher = voucherMap.get(normalizeId(booking.voucherId));

                return (
                  <tr key={bookingId} className="hover:bg-slate-50/40 transition-colors group">
                    <td className="px-6 py-4">
                      <p className="text-xs font-black text-slate-900 uppercase tracking-tight">#{bookingId.slice(-8)}</p>
                      {voucher ? (
                        <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase">Voucher: {voucher.voucherCode}</p>
                      ) : (
                        <p className="text-[10px] font-bold text-slate-300 mt-1 uppercase">Khong voucher</p>
                      )}
                    </td>

                    <td className="px-6 py-4">
                      <p className="text-xs font-black text-slate-900 uppercase tracking-tight">{user?.fullName || normalizeId(booking.userId)}</p>
                      <p className="text-[10px] font-bold text-slate-400 mt-1">{user?.phoneNumber || user?.email || '--'}</p>
                    </td>

                    <td className="px-6 py-4">
                      <p className="text-xs font-black text-slate-900 uppercase tracking-tight">{court?.courtName || normalizeId(booking.courtId)}</p>
                      <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase">
                        {slot ? `${slot.startTime} - ${slot.endTime}` : normalizeId(booking.slotId)}
                      </p>
                    </td>

                    <td className="px-6 py-4">
                      <p className="text-xs font-bold text-slate-900">{formatDate(booking.bookingDate)}</p>
                    </td>

                    <td className="px-6 py-4">
                      <p className="text-xs font-black text-slate-900">{formatMoney(booking.totalPrice)}</p>
                      {booking.discountAmount > 0 ? (
                        <p className="text-[10px] font-bold text-teal-600 mt-1">Giam: {formatMoney(booking.discountAmount)}</p>
                      ) : null}
                    </td>

                    <td className="px-6 py-4 text-center">
                      <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-tighter ${statusClass(booking.status)}`}>
                        {booking.status}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={() => handleEdit(booking)}
                          disabled={isMutating}
                          className="text-[10px] font-black text-slate-500 hover:text-teal-600 uppercase tracking-widest disabled:opacity-40"
                        >
                          Sua
                        </button>

                        {booking.status === 'Pending' ? (
                          <>
                            <span className="text-slate-200 text-xs">|</span>
                            <button
                              type="button"
                              onClick={() => handleStatusUpdate(bookingId, 'Confirmed')}
                              disabled={isMutating}
                              className="text-[10px] font-black text-teal-600 uppercase tracking-widest disabled:opacity-40"
                            >
                              Duyet
                            </button>
                            <span className="text-slate-200 text-xs">|</span>
                            <button
                              type="button"
                              onClick={() => handleStatusUpdate(bookingId, 'Cancelled')}
                              disabled={isMutating}
                              className="text-[10px] font-black text-amber-600 uppercase tracking-widest disabled:opacity-40"
                            >
                              Huy
                            </button>
                          </>
                        ) : null}

                        <span className="text-slate-200 text-xs">|</span>
                        <button
                          type="button"
                          onClick={() => handleDelete(bookingId)}
                          disabled={isMutating}
                          className="text-[10px] font-black text-slate-400 hover:text-red-500 uppercase tracking-widest disabled:opacity-40"
                        >
                          Xoa
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </section>

      {isFormOpen ? (
        <BookingForm
          onSubmit={handleSubmit}
          onCancel={handleCloseForm}
          initialData={editingBooking}
          users={users}
          courts={courts}
          slots={slots}
          vouchers={vouchers}
        />
      ) : null}
    </div>
  );
}
