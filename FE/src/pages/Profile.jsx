import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Profile() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    } else {
      navigate('/login');
    }
  }, [navigate]);

  if (!user) return <div className="min-h-[60vh] flex items-center justify-center">Đang tải...</div>;

  return (
    <div className="min-h-[80vh] flex justify-center bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full">
        <div className="bg-white p-10 rounded-3xl shadow-xl shadow-teal-100/50 border border-slate-100 overflow-hidden relative">
          {/* Background pattern */}
          <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-teal-500 to-teal-700"></div>
          
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
              Thành viên Cầu Lông Vui
            </p>
          </div>

          <div className="mt-12">
            <h3 className="text-lg font-black text-slate-900 border-b-2 border-slate-100 pb-3 mb-6 uppercase tracking-tight">Thông tin cá nhân</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 hover:border-teal-200 transition-colors">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Email</p>
                <p className="text-slate-900 font-medium text-lg truncate" title={user.email}>{user.email || 'Chưa cập nhật'}</p>
              </div>
              
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 hover:border-teal-200 transition-colors">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Số điện thoại</p>
                <p className="text-slate-900 font-medium text-lg">{user.phoneNumber || 'Chưa cập nhật'}</p>
              </div>

              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 hover:border-teal-200 transition-colors">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Số dư tài khoản</p>
                <p className="text-teal-600 font-black text-xl">{user.balance?.toLocaleString('vi-VN')} ₫</p>
              </div>
            </div>
          </div>
          
          <div className="mt-10 flex justify-center">
            <button className="bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 px-8 rounded-xl shadow-lg transition-all" onClick={() => navigate('/')}>
              Quay lại trang chủ
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
