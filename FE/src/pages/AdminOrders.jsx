import React, { useMemo, useState } from 'react';
import { useOrders, useUpdateOrderStatus } from '../hooks/useOrders';
import { usePayments } from '../hooks/usePayments';

const LIST_PARAMS = { page: 1, limit: 300 };
const STATUS_FILTERS = ['All', 'Pending', 'Completed', 'Cancelled'];

const normalizeId = (value) => {
  if (!value) return '';
  if (typeof value === 'string') return value;
  return value.id || value._id || '';
};

const formatMoney = (value) => `${Number(value || 0).toLocaleString('vi-VN')} VND`;

const statusClass = (status) => {
  if (status === 'Completed') return 'bg-teal-50 text-teal-700';
  if (status === 'Cancelled') return 'bg-red-50 text-red-600';
  return 'bg-amber-50 text-amber-700';
};

const paymentStatusClass = (status) => {
  if (status === 'Success') return 'bg-teal-50 text-teal-700';
  if (status === 'Failed') return 'bg-red-50 text-red-600';
  return 'bg-slate-100 text-slate-600';
};

export default function AdminOrders() {
  const [statusFilter, setStatusFilter] = useState('All');
  const [searchKeyword, setSearchKeyword] = useState('');

  const ordersQuery = useOrders(LIST_PARAMS);
  const paymentsQuery = usePayments({ page: 1, limit: 500 });
  const updateStatusMutation = useUpdateOrderStatus();

  const orders = useMemo(() => ordersQuery.data?.items || [], [ordersQuery.data]);
  const payments = useMemo(() => paymentsQuery.data?.items || [], [paymentsQuery.data]);

  const paymentMapByOrderId = useMemo(() => {
    const map = new Map();

    for (const payment of payments) {
      const orderId = normalizeId(payment.orderId);
      if (!orderId) continue;
      if (!map.has(orderId)) {
        map.set(orderId, payment);
      }
    }

    return map;
  }, [payments]);

  const filteredOrders = useMemo(() => {
    const keyword = searchKeyword.trim().toLowerCase();

    return orders.filter((order) => {
      if (statusFilter !== 'All' && order.status !== statusFilter) {
        return false;
      }

      if (!keyword) return true;

      const orderId = normalizeId(order.id || order._id);
      const bookingId = normalizeId(order.bookingId);
      const courtName = order.courtId?.courtName || normalizeId(order.courtId);
      const searchText = [orderId, bookingId, order.customerName, courtName]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return searchText.includes(keyword);
    });
  }, [orders, searchKeyword, statusFilter]);

  async function handleStatusUpdate(orderId, status) {
    return updateStatusMutation.mutateAsync({ id: orderId, status });
  }

  if (ordersQuery.isLoading || paymentsQuery.isLoading) {
    return <div className="text-xs font-black uppercase text-slate-400 p-8">Dang tai don order...</div>;
  }

  if (ordersQuery.error || paymentsQuery.error) {
    const message = ordersQuery.error?.message || paymentsQuery.error?.message || 'Khong the tai du lieu.';
    return (
      <div className="p-8">
        <p className="text-xs font-black uppercase text-red-500">Khong tai duoc du lieu</p>
        <p className="text-sm font-bold text-slate-500 mt-2">{message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col gap-1">
        <h1 className="text-3xl font-black tracking-tight text-slate-900 uppercase">Quan Ly Order Do Uong</h1>
        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">
          DON GOI TRUC TIEP TU LICH SU DAT SAN
        </p>
      </header>

      <section className="bento-card">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tim kiem</label>
            <input
              value={searchKeyword}
              onChange={(event) => setSearchKeyword(event.target.value)}
              placeholder="Tim theo ma order, booking, khach hang..."
              className="mt-2 w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 font-bold text-xs"
            />
          </div>

          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Trang thai order</label>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="mt-2 w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 font-bold text-xs"
            >
              {STATUS_FILTERS.map((status) => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section className="bento-card overflow-hidden !p-0">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-100">
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Order</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Khach / San</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">So Mon</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Tong Tien</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Thanh Toan</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Trang Thai</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Thao Tac</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {filteredOrders.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-[10px] font-black text-slate-300 uppercase italic">
                  Khong co order phu hop
                </td>
              </tr>
            ) : (
              filteredOrders.map((order) => {
                const orderId = normalizeId(order.id || order._id);
                const bookingId = normalizeId(order.bookingId);
                const payment = paymentMapByOrderId.get(orderId);
                const itemCount = Array.isArray(order.items)
                  ? order.items.reduce((sum, item) => sum + Number(item.quantity || 0), 0)
                  : 0;

                return (
                  <tr key={orderId} className="hover:bg-slate-50/40 transition-colors group">
                    <td className="px-6 py-4">
                      <p className="text-xs font-black text-slate-900 uppercase tracking-tight">#{orderId.slice(-8)}</p>
                      <p className="text-[10px] font-bold text-slate-400 mt-1">Booking: #{bookingId ? bookingId.slice(-8) : '--'}</p>
                    </td>

                    <td className="px-6 py-4">
                      <p className="text-xs font-black text-slate-900 uppercase tracking-tight">{order.customerName}</p>
                      <p className="text-[10px] font-bold text-slate-400 mt-1">
                        {order.courtId?.courtName || normalizeId(order.courtId) || '--'}
                      </p>
                    </td>

                    <td className="px-6 py-4">
                      <p className="text-xs font-black text-slate-900">{itemCount}</p>
                    </td>

                    <td className="px-6 py-4">
                      <p className="text-xs font-black text-slate-900">{formatMoney(order.totalAmount)}</p>
                    </td>

                    <td className="px-6 py-4 text-center">
                      {payment ? (
                        <div className="space-y-1">
                          <span className={`inline-flex text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-tighter ${paymentStatusClass(payment.status)}`}>
                            {payment.status}
                          </span>
                          <p className="text-[10px] font-bold text-slate-400">{payment.paymentMethod}</p>
                        </div>
                      ) : (
                        <span className="text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-tighter bg-slate-100 text-slate-500">
                          NO PAYMENT
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-4 text-center">
                      <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-tighter ${statusClass(order.status)}`}>
                        {order.status}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {order.status === 'Pending' ? (
                          <>
                            <button
                              type="button"
                              onClick={() => handleStatusUpdate(orderId, 'Completed')}
                              disabled={updateStatusMutation.isPending}
                              className="text-[10px] font-black text-teal-600 uppercase tracking-widest disabled:opacity-40"
                            >
                              Hoan tat
                            </button>
                            <span className="text-slate-200 text-xs">|</span>
                            <button
                              type="button"
                              onClick={() => handleStatusUpdate(orderId, 'Cancelled')}
                              disabled={updateStatusMutation.isPending}
                              className="text-[10px] font-black text-red-500 uppercase tracking-widest disabled:opacity-40"
                            >
                              Huy
                            </button>
                          </>
                        ) : (
                          <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">No action</p>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}
