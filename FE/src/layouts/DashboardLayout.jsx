import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { clsx } from 'clsx';

const MENU_ITEMS = [
  { label: 'TONG QUAN', path: '/admin' },
  { label: 'SAN DAU', path: '/admin/courts' },
  { label: 'DAT CHO', path: '/admin/bookings' },
  { label: 'SAN PHAM', path: '/admin/products' },
  { label: 'ORDER DO UONG', path: '/admin/orders' },
  { label: 'VOUCHER', path: '/admin/vouchers' },
  { label: 'NGUOI DUNG', path: '/admin/users' },
  { label: 'VAI TRO', path: '/admin/roles' },
];

export default function DashboardLayout({ children }) {
  const location = useLocation();

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans">
      <aside className="w-64 bg-white border-r border-slate-100 flex flex-col sticky top-0 h-screen">
        <header className="p-8">
          <h1 className="text-xl font-black tracking-tighter text-teal-600 italic">CAULONGVUI</h1>
          <p className="text-[10px] font-bold text-slate-400 tracking-widest mt-1">ADMIN PANEL</p>
        </header>

        <nav className="flex-1 px-4 mt-4 overflow-y-auto">
          <ul className="space-y-2 pb-4">
            {MENU_ITEMS.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    aria-label={`Di toi trang ${item.label}`}
                    className={clsx(
                      'relative flex items-center px-4 py-3 rounded-xl transition-all font-bold text-xs tracking-wide',
                      isActive
                        ? 'bg-teal-50 text-teal-600'
                        : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                    )}
                  >
                    {isActive && <span className="absolute left-0 w-1 h-4 bg-teal-600 rounded-full" />}
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <section className="p-4 border-t border-slate-50 space-y-4">
          <Link
            to="/"
            className="flex items-center gap-2 px-4 py-2 text-[10px] font-black text-slate-400 hover:text-teal-600 uppercase tracking-widest transition-colors"
          >
            {'<-'} QUAY LAI TRANG CHU
          </Link>
          <article className="bg-slate-50 p-4 rounded-2xl">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">He thong</p>
            <p className="text-xs font-bold text-slate-900 mt-1">ONLINE</p>
          </article>
        </section>
      </aside>

      <main className="flex-1 flex flex-col">
        <header className="h-16 bg-white border-b border-slate-100 flex items-center justify-between px-8 sticky top-0 z-10">
          <nav aria-label="Breadcrumb">
            <h2 className="text-sm font-bold text-slate-900 uppercase">Dashboard</h2>
          </nav>
          <div className="flex items-center gap-4">
            <section className="text-right">
              <p className="text-xs font-bold text-slate-900 leading-none">ADMINISTRATOR</p>
              <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase">Quan tri vien</p>
            </section>
            <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200" title="User avatar" />
          </div>
        </header>

        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}
