import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useCourtDetail, useCourts } from '../hooks/useCourts';
import { useTimeSlots } from '../hooks/useTimeSlots';
import { useBookingAvailability, useCreateBooking } from '../hooks/useBookings';
import { getApiOrigin } from '../services/api.client';
import { Button } from '../components/ui/Button';

const formatMoney = (value) => Number(value || 0).toLocaleString('vi-VN');
const toDateInput = (date = new Date()) => date.toISOString().slice(0, 10);
const formatDateDMY = (isoDate) => {
  if (!isoDate || !isoDate.includes('-')) return '';
  const [year, month, day] = isoDate.split('-');
  return `${day}/${month}/${year}`;
};

const normalizeId = (value) => {
  if (!value) return '';
  if (typeof value === 'string') return value;
  return value.id || value._id || '';
};

const buildItemKey = ({ courtId, bookingDate, slotId }) => `${courtId}|${bookingDate}|${slotId}`;

export default function CourtDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const apiOrigin = getApiOrigin();

  const initialBookingOpen = (() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('book') === '1' && !!localStorage.getItem('token');
  })();

  const [bookingDate, setBookingDate] = useState(toDateInput());
  const [selectedCourtId, setSelectedCourtId] = useState(id);
  const [selectedSlotIds, setSelectedSlotIds] = useState([]);
  const [bookingItems, setBookingItems] = useState([]);
  const [isBookingOpen, setIsBookingOpen] = useState(initialBookingOpen);
  const [bookingMessage, setBookingMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    setSelectedCourtId(id);
    setSelectedSlotIds([]);
  }, [id]);

  const isBookingSuccess = bookingMessage.type === 'success';
  const isLoggedIn = !!localStorage.getItem('token');

  const courtQuery = useCourtDetail(id);
  const courtsQuery = useCourts({ page: 1, limit: 200 });
  const slotsQuery = useTimeSlots();
  const availabilityQuery = useBookingAvailability(selectedCourtId, bookingDate);

  const createBookingMutation = useCreateBooking();

  const court = courtQuery.data;

  const courts = useMemo(() => {
    const list = courtsQuery.data?.items || [];
    if (!court) return list;

    const exists = list.some((item) => normalizeId(item) === normalizeId(court));
    if (exists) return list;
    return [court, ...list];
  }, [courtsQuery.data, court]);

  const courtMap = useMemo(() => {
    return new Map(courts.map((item) => [normalizeId(item), item]));
  }, [courts]);

  const slots = useMemo(() => {
    if (Array.isArray(slotsQuery.data)) return slotsQuery.data;
    return slotsQuery.data?.items || [];
  }, [slotsQuery.data]);

  const bookedSlotIds = useMemo(() => {
    return new Set(availabilityQuery.data?.bookedSlotIds || []);
  }, [availabilityQuery.data]);

  const cartSlotKeySet = useMemo(() => {
    return new Set(
      bookingItems.map((item) => buildItemKey({
        courtId: item.courtId,
        bookingDate: item.bookingDate,
        slotId: item.slotId,
      }))
    );
  }, [bookingItems]);

  const availableSlots = useMemo(() => {
    return slots.filter((slot) => {
      const slotId = normalizeId(slot);
      const isBooked = bookedSlotIds.has(slotId);
      const alreadyInCart = cartSlotKeySet.has(buildItemKey({ courtId: selectedCourtId, bookingDate, slotId }));
      return !isBooked && !alreadyInCart;
    });
  }, [slots, bookedSlotIds, cartSlotKeySet, selectedCourtId, bookingDate]);

  const selectedCourt = useMemo(() => courtMap.get(selectedCourtId), [courtMap, selectedCourtId]);

  const openBookingPopup = () => {
    setBookingMessage({ type: '', text: '' });

    if (!isLoggedIn) {
      setBookingMessage({ type: 'error', text: 'Ban can dang nhap de dat san.' });
      navigate('/login');
      return;
    }

    setIsBookingOpen(true);
  };

  const closeBookingPopup = () => {
    if (createBookingMutation.isPending) return;
    setIsBookingOpen(false);
    setSelectedSlotIds([]);
    setBookingItems([]);
    setBookingMessage({ type: '', text: '' });
    setSelectedCourtId(id);
    setBookingDate(toDateInput());
  };

  const toggleSlot = (slotId) => {
    setSelectedSlotIds((prev) => {
      if (prev.includes(slotId)) return prev.filter((value) => value !== slotId);
      return [...prev, slotId];
    });
    setBookingMessage({ type: '', text: '' });
  };

  const addSelectedSlotsToCart = () => {
    setBookingMessage({ type: '', text: '' });

    if (!selectedCourtId) {
      setBookingMessage({ type: 'error', text: 'Vui long chon san.' });
      return;
    }

    if (!bookingDate) {
      setBookingMessage({ type: 'error', text: 'Vui long chon ngay dat san.' });
      return;
    }

    if (selectedSlotIds.length === 0) {
      setBookingMessage({ type: 'error', text: 'Vui long chon it nhat mot khung gio.' });
      return;
    }

    const nextItems = [];

    for (const slotId of selectedSlotIds) {
      const slot = slots.find((item) => normalizeId(item) === slotId);
      if (!slot) continue;

      const item = {
        courtId: selectedCourtId,
        courtName: selectedCourt?.courtName || selectedCourtId,
        bookingDate,
        slotId,
        slotLabel: `${slot.startTime} - ${slot.endTime}`,
        price: slot.price,
      };

      const key = buildItemKey(item);
      if (!cartSlotKeySet.has(key)) {
        nextItems.push(item);
      }
    }

    if (nextItems.length === 0) {
      setBookingMessage({ type: 'error', text: 'Cac khung gio da ton tai trong danh sach dat.' });
      return;
    }

    setBookingItems((prev) => [...prev, ...nextItems]);
    setSelectedSlotIds([]);
    setBookingMessage({ type: 'info', text: `Da them ${nextItems.length} khung gio vao danh sach dat.` });
  };

  const removeBookingItem = (item) => {
    const targetKey = buildItemKey(item);
    setBookingItems((prev) => prev.filter((entry) => buildItemKey(entry) !== targetKey));
  };

  const handleBookAll = async () => {
    setBookingMessage({ type: '', text: '' });

    if (bookingItems.length === 0) {
      setBookingMessage({ type: 'error', text: 'Chua co lich dat nao trong danh sach.' });
      return;
    }

    const successIds = [];
    const failedItems = [];

    for (const item of bookingItems) {
      try {
        const booking = await createBookingMutation.mutateAsync({
          courtId: item.courtId,
          slotId: item.slotId,
          bookingDate: item.bookingDate,
        });

        const shortId = String(booking?.id || '').slice(-8);
        successIds.push(shortId ? `#${shortId}` : '(khong co ma)');
      } catch (error) {
        failedItems.push({ item, error });
      }
    }

    if (successIds.length > 0 && failedItems.length === 0) {
      setBookingItems([]);
      setSelectedSlotIds([]);
      setBookingMessage({
        type: 'success',
        text: `Dat san thanh cong. Ma booking: ${successIds.join(', ')}`,
      });
      return;
    }

    if (successIds.length > 0 && failedItems.length > 0) {
      const remainKeys = new Set(failedItems.map(({ item }) => buildItemKey(item)));
      setBookingItems((prev) => prev.filter((entry) => remainKeys.has(buildItemKey(entry))));
      setSelectedSlotIds([]);

      const firstError = failedItems[0]?.error?.message || 'Mot so lich dat khong thanh cong.';
      setBookingMessage({
        type: 'error',
        text: `Da dat thanh cong ${successIds.length} lich. ${failedItems.length} lich loi: ${firstError}`,
      });
      return;
    }

    setBookingMessage({
      type: 'error',
      text: failedItems[0]?.error?.message || 'Khong the dat san. Vui long thu lai.',
    });
  };

  if (courtQuery.isLoading) {
    return (
      <section className="max-w-6xl mx-auto p-8">
        <p className="text-xs font-black uppercase tracking-widest text-slate-400">Dang tai chi tiet san...</p>
      </section>
    );
  }

  if (courtQuery.isError || !courtQuery.data) {
    return (
      <section className="max-w-6xl mx-auto p-8 space-y-4">
        <p className="text-sm font-black text-red-500 uppercase">Khong tim thay san</p>
        <p className="text-sm text-slate-500 font-medium">
          {courtQuery.error?.message || 'San da bi xoa hoac khong ton tai.'}
        </p>
        <Link
          to="/"
          className="inline-flex px-5 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest"
        >
          Quay lai trang chu
        </Link>
      </section>
    );
  }

  return (
    <div className="bg-slate-50 min-h-[calc(100vh-80px)]">
      <section className="max-w-6xl mx-auto px-8 py-10 space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            to="/#danh-sach-san"
            className="text-[11px] font-black uppercase tracking-widest text-slate-500 hover:text-teal-600"
          >
            {'<-'} Quay lai danh sach san
          </Link>
          <span
            className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest ${
              court.isMaintenance ? 'bg-red-100 text-red-600' : 'bg-teal-100 text-teal-700'
            }`}
          >
            {court.isMaintenance ? 'Bao tri' : 'Dang hoat dong'}
          </span>
        </div>

        <article className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm">
          <div className="grid grid-cols-1 lg:grid-cols-2">
            <div className="aspect-[4/3] bg-slate-100">
              <img
                src={`${apiOrigin}${court.imageUrl}`}
                alt={court.courtName}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="p-8 lg:p-10 flex flex-col gap-6">
              <div className="space-y-2">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-teal-600">Chi tiet san</p>
                <h1 className="text-4xl font-black uppercase tracking-tight text-slate-900">{court.courtName}</h1>
                <p className="text-slate-500 font-medium leading-relaxed">
                  {court.description || 'San chua co mo ta chi tiet.'}
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 border border-slate-100 p-5">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Gia san mac dinh</p>
                <p className="text-3xl font-black text-teal-600 mt-1">
                  {formatMoney(court.basePrice)}
                  <span className="text-sm text-slate-400 ml-1">VND / gio</span>
                </p>
              </div>

              <div className="pt-2">
                <Button
                  type="button"
                  onClick={openBookingPopup}
                  disabled={court.isMaintenance}
                  className="w-full sm:w-auto"
                >
                  {court.isMaintenance ? 'San dang bao tri' : isLoggedIn ? 'Dat san' : 'Dang nhap de dat san'}
                </Button>
                {!isLoggedIn && !court.isMaintenance ? (
                  <p className="text-[11px] font-bold text-slate-400 mt-3">
                    Ban can dang nhap de chon ngay va khung gio dat san.
                  </p>
                ) : null}
              </div>

              {bookingMessage.text && !isBookingOpen ? (
                <div
                  className={`rounded-2xl p-4 border ${
                    bookingMessage.type === 'success'
                      ? 'bg-teal-50 border-teal-100 text-teal-700'
                      : 'bg-red-50 border-red-100 text-red-600'
                  }`}
                >
                  <p className="text-sm font-bold">{bookingMessage.text}</p>
                </div>
              ) : null}
            </div>
          </div>
        </article>
      </section>

      {isBookingOpen ? (
        <aside className="fixed inset-0 z-50 bg-slate-900/45 backdrop-blur-sm flex items-center justify-center p-4">
          <section className="w-full max-w-5xl bg-white rounded-3xl border border-slate-100 shadow-2xl overflow-hidden">
            <header className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-teal-600">Dat san</p>
                <h2 className="text-xl font-black uppercase tracking-tight text-slate-900">Dat nhieu khung gio / nhieu san</h2>
              </div>
              <button
                type="button"
                onClick={closeBookingPopup}
                className="px-3 py-2 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-slate-900"
              >
                Dong
              </button>
            </header>

            <div className="p-6 space-y-6 max-h-[80vh] overflow-auto">
              {isBookingSuccess ? (
                <div className="min-h-[260px] flex flex-col items-center justify-center gap-5 text-center">
                  <div className="rounded-2xl p-6 border bg-teal-50 border-teal-100 text-teal-700 w-full max-w-2xl">
                    <p className="text-xl font-black uppercase tracking-tight">Dat san thanh cong</p>
                    <p className="text-base font-bold mt-2">{bookingMessage.text}</p>
                  </div>
                  <Button type="button" onClick={closeBookingPopup}>
                    Dong
                  </Button>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-end">
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">San</label>
                      <select
                        value={selectedCourtId}
                        onChange={(event) => {
                          setSelectedCourtId(event.target.value);
                          setSelectedSlotIds([]);
                          setBookingMessage({ type: '', text: '' });
                        }}
                        className="mt-2 w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-100 font-bold text-xs"
                      >
                        {courts.map((item) => {
                          const value = normalizeId(item);
                          return (
                            <option key={value} value={value}>
                              {item.courtName} {item.isMaintenance ? '(Bao tri)' : ''}
                            </option>
                          );
                        })}
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Ngay dat san</label>
                      <div className="relative mt-2">
                        <input
                          type="text"
                          readOnly
                          value={formatDateDMY(bookingDate)}
                          className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-100 font-bold text-xs"
                        />
                        <input
                          type="date"
                          min={toDateInput()}
                          value={bookingDate}
                          onChange={(event) => {
                            setBookingDate(event.target.value);
                            setSelectedSlotIds([]);
                            setBookingMessage({ type: '', text: '' });
                          }}
                          className="absolute inset-0 opacity-0 cursor-pointer"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-[10px] font-black pointer-events-none">CAL</span>
                      </div>
                    </div>

                    <Button
                      type="button"
                      onClick={addSelectedSlotsToCart}
                      disabled={selectedSlotIds.length === 0 || !!selectedCourt?.isMaintenance}
                      className="w-full"
                    >
                      Them vao danh sach
                    </Button>
                  </div>

                  {selectedCourt?.isMaintenance ? (
                    <div className="rounded-2xl p-4 border bg-amber-50 border-amber-100 text-amber-700">
                      <p className="text-sm font-bold">San dang bao tri, khong the dat lich.</p>
                    </div>
                  ) : null}

                  {bookingMessage.text ? (
                    <div
                      className={`rounded-2xl p-4 border ${
                        bookingMessage.type === 'error'
                          ? 'bg-red-50 border-red-100 text-red-600'
                          : bookingMessage.type === 'info'
                            ? 'bg-slate-50 border-slate-100 text-slate-600'
                            : 'bg-teal-50 border-teal-100 text-teal-700'
                      }`}
                    >
                      <p className="text-sm font-bold">{bookingMessage.text}</p>
                    </div>
                  ) : null}

                  <section className="space-y-4">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="text-lg font-black uppercase tracking-tight text-slate-900">Chon khung gio</h3>
                      <span className="text-[10px] font-black text-slate-400 uppercase">Da chon: {selectedSlotIds.length}</span>
                    </div>

                    {slotsQuery.isLoading || availabilityQuery.isLoading ? (
                      <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 text-sm font-bold text-slate-500">
                        Dang tai khung gio...
                      </div>
                    ) : availableSlots.length === 0 ? (
                      <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 text-sm font-bold text-slate-500">
                        Khong con khung gio trong cho san va ngay da chon.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {availableSlots.map((slot) => {
                          const slotId = normalizeId(slot);
                          const isSelected = selectedSlotIds.includes(slotId);

                          return (
                            <article
                              key={slotId}
                              className={`border rounded-2xl p-5 transition-all ${
                                isSelected ? 'bg-teal-50 border-teal-500 shadow-sm' : 'bg-white border-slate-100'
                              }`}
                            >
                              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Khung gio</p>
                              <p className="text-lg font-black text-slate-900 mt-1">
                                {slot.startTime} - {slot.endTime}
                              </p>
                              <p className="text-sm font-black text-teal-600 mt-2">{formatMoney(slot.price)} VND</p>

                              <button
                                type="button"
                                onClick={() => toggleSlot(slotId)}
                                className={`mt-4 w-full px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                  isSelected
                                    ? 'bg-teal-600 text-white'
                                    : 'bg-slate-900 text-white hover:bg-teal-600'
                                }`}
                              >
                                {isSelected ? 'Bo chon' : 'Chon khung gio'}
                              </button>
                            </article>
                          );
                        })}
                      </div>
                    )}
                  </section>

                  <section className="space-y-4">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="text-lg font-black uppercase tracking-tight text-slate-900">Danh sach dat</h3>
                      <span className="text-[10px] font-black text-slate-400 uppercase">Tong: {bookingItems.length}</span>
                    </div>

                    {bookingItems.length === 0 ? (
                      <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 text-sm font-bold text-slate-500">
                        Chua co lich dat nao. Hay chon khung gio va bam "Them vao danh sach".
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {bookingItems.map((item) => {
                          const rowKey = buildItemKey(item);
                          return (
                            <article
                              key={rowKey}
                              className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 grid grid-cols-1 md:grid-cols-5 gap-3 items-center"
                            >
                              <div className="md:col-span-2">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">San</p>
                                <p className="text-sm font-black text-slate-900">{item.courtName}</p>
                              </div>
                              <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Ngay</p>
                                <p className="text-sm font-black text-slate-900">{formatDateDMY(item.bookingDate)}</p>
                              </div>
                              <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Khung gio</p>
                                <p className="text-sm font-black text-slate-900">{item.slotLabel}</p>
                              </div>
                              <div className="md:text-right flex md:block justify-between items-center gap-2">
                                <p className="text-sm font-black text-teal-600">{formatMoney(item.price)} VND</p>
                                <button
                                  type="button"
                                  onClick={() => removeBookingItem(item)}
                                  className="text-[10px] font-black uppercase tracking-widest text-red-500 hover:text-red-700"
                                >
                                  Xoa
                                </button>
                              </div>
                            </article>
                          );
                        })}

                        <div className="flex justify-end pt-2">
                          <Button
                            type="button"
                            onClick={handleBookAll}
                            disabled={bookingItems.length === 0 || createBookingMutation.isPending}
                            isLoading={createBookingMutation.isPending}
                          >
                            Dat tat ca ({bookingItems.length})
                          </Button>
                        </div>
                      </div>
                    )}
                  </section>
                </>
              )}
            </div>
          </section>
        </aside>
      ) : null}
    </div>
  );
}
