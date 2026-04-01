import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useBookings } from '../hooks/useBookings';
import { useCourts } from '../hooks/useCourts';
import { useOverview, useRevenueByMonth } from '../hooks/useStatistics';

const formatMoney = (value) => `${Number(value || 0).toLocaleString('vi-VN')} VND`;

const formatDate = (value) => {
  if (!value) return '--';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '--';
  return date.toLocaleDateString('vi-VN');
};

const statusClass = (status) => {
  if (status === 'Confirmed') return 'text-teal-600';
  if (status === 'Cancelled') return 'text-red-600';
  if (status === 'Expired') return 'text-slate-500';
  return 'text-amber-600';
};

const normalizeId = (value) => {
  if (!value) return '';
  if (typeof value === 'string') return value;
  return value.id || value._id || '';
};

export default function Dashboard() {
  const currentYear = new Date().getFullYear();

  const overviewQuery = useOverview();
  const revenueQuery = useRevenueByMonth(currentYear);
  const bookingsQuery = useBookings({ page: 1, limit: 8 });
  const courtsQuery = useCourts({ page: 1, limit: 200 });

  const overview = overviewQuery.data || {};

  const monthlyRevenue = useMemo(() => {
    const source = Array.isArray(revenueQuery.data) ? revenueQuery.data : [];
    const revenueMap = new Map(source.map((item) => [Number(item.month), Number(item.totalRevenue || 0)]));

    const rows = Array.from({ length: 12 }, (_, index) => {
      const month = index + 1;
      const revenue = revenueMap.get(month) || 0;
      return { month, revenue };
    });

    const maxRevenue = Math.max(...rows.map((item) => item.revenue), 0);

    return rows.map((item) => ({
      ...item,
      percent: maxRevenue > 0 ? Math.max((item.revenue / maxRevenue) * 100, item.revenue > 0 ? 8 : 0) : 0,
    }));
  }, [revenueQuery.data]);

  const courts = useMemo(() => courtsQuery.data?.items || [], [courtsQuery.data]);
  const courtMap = useMemo(() => {
    return new Map(courts.map((court) => [normalizeId(court), court.courtName]));
  }, [courts]);

  const recentBookings = useMemo(() => {
    const items = bookingsQuery.data?.items || [];
    return [...items]
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
      .slice(0, 6);
  }, [bookingsQuery.data]);

  const statCards = [
    {
      label: 'TONG DOANH THU',
      value: formatMoney(overview.totalRevenue),
      sub: 'DOANH THU THANH TOAN THANH CONG',
    },
    {
      label: 'TONG DON DAT',
      value: Number(overview.totalBookings || 0).toLocaleString('vi-VN'),
      sub: `${Number(overview.todayBookings || 0).toLocaleString('vi-VN')} DON MOI HOM NAY`,
    },
    {
      label: 'SAN HOAT DONG',
      value: `${Number(overview.activeCourts || 0)}/${Number(overview.totalCourts || 0)}`,
      sub: `${Number(overview.maintenanceCourts || 0)} SAN DANG BAO TRI`,
    },
    {
      label: 'TONG NGUOI DUNG',
      value: Number(overview.totalUsers || 0).toLocaleString('vi-VN'),
      sub: `${Number(overview.newUsers24h || 0)} MOI TRONG 24H QUA`,
    },
  ];

  if (overviewQuery.isLoading || revenueQuery.isLoading) {
    return <div className="text-xs font-black uppercase text-slate-400 p-8">DANG TAI DU LIEU TONG QUAN...</div>;
  }

  if (overviewQuery.isError || revenueQuery.isError) {
    return (
      <div className="p-8 space-y-2">
        <p className="text-xs font-black uppercase text-red-500">KHONG TAI DUOC DU LIEU THONG KE</p>
        <p className="text-sm font-bold text-slate-500">
          {overviewQuery.error?.message || revenueQuery.error?.message || 'Vui long kiem tra token dang nhap va ket noi API.'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col gap-1">
        <h1 className="text-3xl font-black tracking-tight text-slate-900 uppercase">Tong Quan He Thong</h1>
        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">DU LIEU THOI GIAN THUC</p>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" aria-label="Thong ke nhanh">
        {statCards.map((stat) => (
          <article key={stat.label} className="bento-card hover:scale-[1.02] transition-transform cursor-default">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{stat.label}</p>
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">{stat.value}</h3>
            <p className="text-[10px] font-bold text-teal-600 mt-2 uppercase">{stat.sub}</p>
          </article>
        ))}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="lg:col-span-2 bento-card h-80 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Doanh Thu Theo Thang ({currentYear})</h4>
            <p className="text-[10px] font-bold text-slate-400 uppercase">DON VI: VND</p>
          </div>

          <div className="flex-1 flex items-end gap-2">
            {monthlyRevenue.map((item) => (
              <article key={item.month} className="flex-1 flex flex-col items-center gap-2 min-w-0">
                <div className="w-full h-44 bg-slate-50 rounded-lg border border-slate-100 flex items-end p-1">
                  <div
                    className="w-full bg-teal-500/85 rounded-md transition-all"
                    style={{ height: `${item.percent}%` }}
                    title={`${item.month}: ${formatMoney(item.revenue)}`}
                  />
                </div>
                <p className="text-[10px] font-black text-slate-400 uppercase">T{item.month}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="bento-card h-80 flex flex-col">
          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Hoat Dong Gan Day</h4>

          {bookingsQuery.isLoading ? (
            <p className="text-[10px] font-bold text-slate-400 uppercase">Dang tai lich su dat san...</p>
          ) : recentBookings.length === 0 ? (
            <p className="text-[10px] font-bold text-slate-400 uppercase">Chua co hoat dong dat san.</p>
          ) : (
            <ul className="space-y-3 flex-1">
              {recentBookings.map((booking) => {
                const bookingId = normalizeId(booking.id || booking._id);
                const courtName = courtMap.get(normalizeId(booking.courtId)) || normalizeId(booking.courtId);

                return (
                  <li key={bookingId} className="flex justify-between items-center border-b border-slate-50 pb-2 gap-3">
                    <div>
                      <p className="text-xs font-black text-slate-900 uppercase leading-none">#{bookingId.slice(-8)}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">{courtName} • {formatDate(booking.bookingDate)}</p>
                    </div>
                    <div className={`text-[10px] font-black uppercase leading-none ${statusClass(booking.status)}`}>
                      {booking.status}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          <Link
            to="/admin/bookings"
            className="w-full py-2 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-teal-600 transition-colors mt-4"
          >
            XEM TAT CA
          </Link>
        </section>
      </div>
    </div>
  );
}

