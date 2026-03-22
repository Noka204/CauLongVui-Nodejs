import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLogout } from '../hooks/useAuth';

export default function MainLayout({ children }) {
  const [user, setUser] = useState(null);
  const { mutate: logout } = useLogout();
  const navigate = useNavigate();

  useEffect(() => {
    const checkUser = () => {
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        try {
          setUser(JSON.parse(savedUser));
        } catch (e) {
          console.error('Lỗi parse thông tin user');
        }
      } else {
        setUser(null);
      }
    };

    checkUser();
    window.addEventListener('user-login', checkUser);
    return () => window.removeEventListener('user-login', checkUser);
  }, []);

  const handleLogout = () => {
    logout(undefined, {
      onSuccess: () => {
        window.dispatchEvent(new Event('user-login'));
        navigate('/');
      }
    });
  };

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-slate-100 h-20 flex items-center px-8 sm:px-12 justify-between">
        <Link to="/" className="text-2xl font-black tracking-tighter text-teal-600 italic">
          CAULONGVUI
        </Link>
        
        <div className="hidden md:flex items-center gap-8">
          <Link to="/" className="text-sm font-bold text-slate-900 hover:text-teal-600 transition-colors uppercase tracking-tight">Trang chủ</Link>
          <a href="#danh-sach-san" className="text-sm font-bold text-slate-500 hover:text-teal-600 transition-colors uppercase tracking-tight">Sân cầu lông</a>
          <Link to="/vouchers" className="text-sm font-bold text-slate-500 hover:text-teal-600 transition-colors uppercase tracking-tight">Khuyến mãi</Link>
        </div>

        <div className="flex items-center gap-4">
          <Link to="/admin" className="text-xs font-black px-5 py-2.5 rounded-xl border-2 border-slate-100 hover:border-teal-600 hover:text-teal-600 transition-all uppercase tracking-widest hidden sm:block">
            Quản trị
          </Link>
          {user ? (
            <div className="flex items-center gap-3">
               <Link to="/profile" className="flex items-center gap-2 hover:bg-slate-50 p-2 rounded-xl transition-colors cursor-pointer border border-transparent hover:border-slate-200">
                 <img src={user.avatar || 'https://ui-avatars.com/api/?name=User&background=random'} alt="avatar" className="w-10 h-10 rounded-full shadow-sm" />
                 <span className="text-sm font-bold text-slate-700 hidden md:block">{user.fullName || 'Người dùng'}</span>
               </Link>
               <button onClick={handleLogout} className="text-xs font-bold text-red-500 hover:text-red-700 transition-colors px-3 py-2 border border-red-100 hover:bg-red-50 rounded-xl">
                 Đăng xuất
               </button>
            </div>
          ) : (
            <Link to="/login" className="bg-teal-600 text-white text-xs font-black px-6 py-3 rounded-xl shadow-lg shadow-teal-600/20 hover:bg-teal-700 transition-all uppercase tracking-widest">
              Đăng nhập
            </Link>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <main className="pt-20">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-16 px-8 sm:px-12">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="space-y-4">
            <h3 className="text-xl font-black italic tracking-tighter text-teal-400">CAULONGVUI</h3>
            <p className="text-sm text-slate-400 leading-relaxed">Nền tảng đặt sân cầu lông hiện đại, nhanh chóng và tin cậy nhất Việt Nam.</p>
          </div>
          <div>
            <h4 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-4">Dịch vụ</h4>
            <ul className="space-y-2 text-sm font-bold text-slate-300">
              <li><Link to="/" className="hover:text-teal-400 transition-colors">Đặt sân trực tuyến</Link></li>
              <li><Link to="/" className="hover:text-teal-400 transition-colors">Mua sắm thiết bị</Link></li>
              <li><Link to="/" className="hover:text-teal-400 transition-colors">Tổ chức giải đấu</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-4">Hỗ trợ</h4>
            <ul className="space-y-2 text-sm font-bold text-slate-300">
              <li><Link to="/" className="hover:text-teal-400 transition-colors">Điều khoản dịch vụ</Link></li>
              <li><Link to="/" className="hover:text-teal-400 transition-colors">Chính sách bảo mật</Link></li>
              <li><Link to="/" className="hover:text-teal-400 transition-colors">Câu hỏi thường gặp</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-4">Liên hệ</h4>
            <p className="text-sm font-bold text-slate-300">support@caulongvui.vn</p>
            <p className="text-sm font-bold text-slate-300 mt-2">+84 123 456 789</p>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-12 pt-8 border-t border-slate-800 text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">© 2024 CAULONGVUI - SỐNG TRỌN ĐAM MÊ</p>
        </div>
      </footer>
    </div>
  );
}
