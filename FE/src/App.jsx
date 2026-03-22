import React from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import DashboardLayout from './layouts/DashboardLayout';
import Dashboard from './pages/Dashboard';
import Courts from './pages/Courts';
import Bookings from './pages/Bookings';
import Vouchers from './pages/Vouchers';
import Users from './pages/Users';
import Roles from './pages/Roles';
import { useSocket } from './hooks/useSocket';

import MainLayout from './layouts/MainLayout';
import Home from './pages/Home';

const queryClient = new QueryClient();

function SocketInit() {
  useSocket();
  return null;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SocketInit />
      <BrowserRouter>
        <Routes>
          {/* Public Landing Page */}
          <Route path="/" element={<MainLayout><Home /></MainLayout>} />

          {/* Admin Dashboard Routes */}
          <Route path="/admin" element={<DashboardLayout><Dashboard /></DashboardLayout>} />
          <Route path="/admin/courts" element={<DashboardLayout><Courts /></DashboardLayout>} />
          <Route path="/admin/bookings" element={<DashboardLayout><Bookings /></DashboardLayout>} />
          <Route path="/admin/vouchers" element={<DashboardLayout><Vouchers /></DashboardLayout>} />
          <Route path="/admin/users" element={<DashboardLayout><Users /></DashboardLayout>} />
          <Route path="/admin/roles" element={<DashboardLayout><Roles /></DashboardLayout>} />

          {/* Fallback */}
          <Route path="*" element={
            <MainLayout>
              <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 text-center">
                <h1 className="text-9xl font-black text-slate-100 absolute -z-10 select-none">404</h1>
                <div className="relative z-10">
                  <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Trang không tồn tại</h2>
                  <p className="text-slate-500 font-medium mt-2 mb-8">Xin lỗi, chúng mình không tìm thấy nội dung bạn đang tìm kiếm.</p>
                  <Link to="/" className="px-8 py-3 bg-teal-600 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-xl shadow-teal-600/20 hover:bg-teal-700 transition-all">
                    Về trang chủ
                  </Link>
                </div>
              </div>
            </MainLayout>
          } />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
